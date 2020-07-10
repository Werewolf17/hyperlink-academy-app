import { PrismaClient } from "@prisma/client"
import { ResultType, APIHandler, Request } from "../../../../../../src/apiHelpers"
import { sendCohortEnrollmentEmail } from '../../../../../../emails'
import Stripe from 'stripe'
import { getToken } from "../../../../../../src/token";
import { addMember, getGroupId, getTaggedPost } from "../../../../../../src/discourse";

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
let prisma = new PrismaClient()
export type EnrollResponse= ResultType<typeof enroll>

export default APIHandler(enroll)

async function enroll (req: Request) {
  let cohortId = req.query.cohortId as string
  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({
    where: {id: cohortId},
    include: {
      courses: {
        select: {
          cost: true,
          name: true
        }
      }
    }
  })
  await prisma.disconnect()
  if(!cohort || cohort.courses.cost === undefined) return {status: 400, result: "Error: no cohort with id " + cohortId + " found"}  as const

  if(cohort.courses.cost === 0) {
    let groupId = await getGroupId(cohortId)

    await prisma.people_in_cohorts.create({data: {
      people: {connect: {id: user.id}},
      course_cohorts: {connect: {id: cohortId}}
    }})

    await addMember(groupId, user.username)
    let gettingStarted = await getTaggedPost(`${cohort.course}/${cohort.id}`, 'getting-started')

    await sendCohortEnrollmentEmail(user.email, {
      name: user.display_name || user.username,
      course_start_date: cohort.start_date,
      course_name: cohort.courses.name,
      cohort_page_url: `https://hyperlink.academy/courses/${cohort.course}/${cohort.id}`,
      cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.course}/${cohort.id}`,
      get_started_topic_url: `https://forum.hyperlink.academy/t/${gettingStarted.id}`
    })
    return {
      status: 200,
      result: {zeroCost: true} as const
    }
  }

  else {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        name: cohort.courses.name,
        amount: cohort.courses.cost * 100,
        currency: 'usd',
        quantity: 1,
      }],
      cancel_url: `${req.headers.origin}/courses/${cohort.course}/${cohort.id}`,
      success_url: `${req.headers.origin}/courses/${cohort.course}/${cohort.id}?welcome`,
      customer_email: user.email,
      metadata: {
        cohortId: cohort.id,
        userId: user.id
      }
    });

    return {
      status: 200,
      result: {sessionId: session.id}
    } as const
  }
}
