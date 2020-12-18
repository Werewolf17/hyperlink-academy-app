import { PrismaClient } from "@prisma/client"
import * as rt from 'runtypes'
import { ResultType, APIHandler, Request } from "src/apiHelpers"
import {StripePaymentMetaData, stripe} from 'src/stripe'
import { sendCohortEnrollmentEmail, sendEnrollNotificationEmaill } from 'emails'
import { getToken } from "src/token";
import { addMember, DISCOURSE_URL, getTaggedPost } from "src/discourse";
import { prettyDate } from "src/utils"

let prisma = new PrismaClient()
export type EnrollResponse= ResultType<typeof enroll>
export type EnrollMsg  = rt.Static<typeof EnrollMsgValidator>

export default APIHandler(enroll)

let EnrollMsgValidator = rt.Record({
  discount: rt.Union(rt.Undefined, rt.String)
})

async function enroll (req: Request) {
  let cohortId = parseInt(req.query.cohortId as string)
  if(Number.isNaN(cohortId)) return {status: 400, result: "ERROR: Cohort id is not a number"} as const
  let user = getToken(req)
  if(!user) return {status: 401, result: "Error: no user logged in"} as const

  let msg
  try {msg = EnrollMsgValidator.check(req.body)}
  catch(e) {return {status:400, result:e.toString()} as const }

  let [cohort, person, discount] = await Promise.all([
    prisma.course_cohorts.findOne({
      where: {id: cohortId},
      include: {
        discourse_groups: true,
        people: {
          select:{email: true}
        },
        courses: {
          select: {
            course_groupTodiscourse_groups: true,
            invite_only: true,
            category_id: true,
            cost: true,
            slug: true,
            name: true,
            course_invites:{
              where: {
                email: user.email
              }
            }
          }
        }
      }
    }),
    prisma.people.findOne({where:{id:user.id}}),
    msg.discount ? prisma.course_discounts.findOne({where: {code: msg.discount}}) : null
  ])

  if(!cohort || cohort.courses.cost === undefined) return {status: 400, result: "Error: no cohort with id " + cohortId + " found"}  as const
  if(msg.discount && (!discount || discount.deleted)) return {status: 404, result: {discount: msg.discount}} as const
  if(discount && discount.max_redeems !== 0 &&discount.max_redeems <= discount.redeems) return {
    status: 403,
    result: {
      message: "ERROR: Discount code has no uses left",
      discount: msg.discount
    }
  } as const

  if(cohort.courses.invite_only && cohort.courses.course_invites.length === 0){
    return {status: 401, result: "ERROR: Course is invite_only and user is not invited"} as const
  }

  let origin = (new URL(req.headers.referer || '')).origin
  let price = cohort.courses.cost
  if(discount) {
    if(discount.type === 'absolute') price = price - discount.amount
    else price = price - (Math.floor((discount.amount/100)*price))
  }
  if(price === 0) {
    let gettingStarted = await getTaggedPost(cohort.category_id, 'getting-started')
    await Promise.all([
      discount ? prisma.course_discounts.update({where:{code: discount.code}, data:{redeems:{increment: 1}}}) : null,
      prisma.people_in_cohorts.create({data: {
        amount_paid: 0,
        people: {connect: {id: user.id}},
        course_cohorts: {connect: {id: cohortId}},
        course_discounts: discount ? {connect:{code: discount.code}} : undefined
      }}),
      addMember(cohort.discourse_groups.id, user.username),
      addMember(cohort.courses.course_groupTodiscourse_groups.id, user.username),
      sendCohortEnrollmentEmail(user.email, {
        name: user.display_name || user.username,
        course_start_date: prettyDate(cohort.start_date),
        course_name: cohort.courses.name,
        cohort_page_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `${DISCOURSE_URL}/session/sso?return_path=/c/${cohort.category_id}`,
        get_started_topic_url: `${DISCOURSE_URL}/t/${gettingStarted.id}`
      }),
      sendEnrollNotificationEmaill(cohort.people.email, {
        learner: user.display_name || user.username,
        course: cohort.courses.name,
        cohort_page_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `${DISCOURSE_URL}/session/sso?return_path=/c/${cohort.category_id}`,
      })
    ])
    return {
      status: 200,
      result: {zeroCost: true} as const
    }
  }

  let metadata: StripePaymentMetaData = {
    type: 'cohort',
    cohortId: cohort.id.toString(),
    userId: user.id,
    discount: discount?.code || null
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer: person?.stripe_customer_id || undefined,
    customer_email: person?.stripe_customer_id ? undefined : user.email,
    payment_intent_data: {
      transfer_group: cohort.id.toString()
    },
    line_items: [{
      name: cohort.courses.name +
        (discount ? `, ${discount?.type === 'absolute' ? '$'+discount?.amount : discount?.amount+"%"} Off` : ''),
      amount: price * 100,
      currency: 'usd',
      quantity: 1,
    }],
    cancel_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
    success_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}?welcome`,
    metadata
  });

  return {
    status: 200,
    result: {sessionId: session.id}
  } as const
}
