import { PrismaClient } from "@prisma/client"
import * as rt from 'runtypes'
import { ResultType, APIHandler, Request } from "src/apiHelpers"
import { sendCohortEnrollmentEmail, sendEnrollNotificationEmaill } from 'emails'
import Stripe from 'stripe'
import { getToken } from "src/token";
import { addMember, getTaggedPost } from "src/discourse";

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
let prisma = new PrismaClient()
export type EnrollResponse= ResultType<typeof enroll>
export type EnrollMsg  = rt.Static<typeof EnrollMsgValidator>

export default APIHandler(enroll)

let EnrollMsgValidator = rt.Record({
  discount: rt.Union(rt.Undefined, rt.String)
})

export type StripeMetaData = {
  cohortId:string,
  userId:string,
  discount: string | null
}

async function enroll (req: Request) {
  let cohortId = parseInt(req.query.cohortId as string)
  if(Number.isNaN(cohortId)) return {status: 400, result: "ERROR: Cohort id is not a number"} as const
  let user = getToken(req)
  if(!user) return {status: 401, result: "Error: no user logged in"} as const

  let msg
  try {msg = EnrollMsgValidator.check(req.body)}
  catch(e) {return {status:400, result:e.toString()} as const }

  let [cohort, discount] = await Promise.all([
    await prisma.course_cohorts.findOne({
      where: {id: cohortId},
      include: {
        people: {
          select:{email: true}
        },
        courses: {
          select: {
            category_id: true,
            cost: true,
            slug: true,
            name: true
          }
        }
      }
    }),
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

  let origin = (new URL(req.headers.referer || '')).origin
  if(cohort.courses.cost === 0) {
    let gettingStarted = await getTaggedPost(cohort.category_id, 'getting-started')
    await Promise.all([
      prisma.people_in_cohorts.create({data: {
        people: {connect: {id: user.id}},
        course_cohorts: {connect: {id: cohortId}}
      }}),
      addMember(cohort.group_id, user.username),
      sendCohortEnrollmentEmail(user.email, {
        name: user.display_name || user.username,
        course_start_date: cohort.start_date,
        course_name: cohort.courses.name,
        cohort_page_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.category_id}`,
        get_started_topic_url: `https://forum.hyperlink.academy/t/${gettingStarted.id}`
      }),
      sendEnrollNotificationEmaill(cohort.people.email, {
        learner: user.display_name || user.username,
        course: cohort.courses.name,
        cohort_page_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.category_id}`,
      })
    ])
    return {
      status: 200,
      result: {zeroCost: true} as const
    }
  }

  let price = cohort.courses.cost
  if(discount) {
    if(discount.type === 'absolute') price = price - discount.amount
    else price = price - (Math.floor((discount.amount/100)*price))
  }

  let metadata: StripeMetaData = {
      cohortId: cohort.id.toString(),
      userId: user.id,
      discount: discount?.code || null
    }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      name: cohort.courses.name +
        (discount ? `, ${discount?.type === 'absolute' ? '$'+discount?.amount : discount?.amount+"%"} Off` : ''),
      amount: price * 100,
      currency: 'usd',
      quantity: 1,
    }],
    cancel_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
    success_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}?welcome`,
    customer_email: user.email,
    metadata
  });

  return {
    status: 200,
    result: {sessionId: session.id}
  } as const
}
