import { NextApiRequest, NextApiResponse} from 'next'
import Stripe from 'stripe'
import {PrismaClient} from '@prisma/client'
import { getUsername, addMember, getTaggedPost} from '../../src/discourse'
import { sendCohortEnrollmentEmail, sendEnrollNotificationEmaill } from '../../emails';
import { prettyDate } from '../../src/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: false
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const sig = req.headers['stripe-signature'];
  if(!sig) return res.status(400).send(`Webhook Error: No signature!`);
  let event
  try {
    let body:string = await new Promise(resolve => {
      let chunks: Uint8Array[] = []
      req.on('data', (chunk) => {
        chunks.push(chunk);
      }).on('end', () => {
        resolve(Buffer.concat(chunks).toString());
      });
    })
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK as string);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const {metadata} = event.data.object as {customer_email:string, metadata: {cohortId:string, userId:string}} ;

    let cohortId = parseInt(metadata.cohortId)
    let person = await prisma.people.findOne({where: {id: metadata.userId}})
    if(!person) return {status: 400, result: "ERROR: cannot find user with id: " + metadata.userId} as const

    let cohort = await prisma.course_cohorts.findOne({
      where: {id: cohortId},
      include: {
        people: {select:{email:true}},
        courses: {
          select: {
            category_id: true,
            slug: true,
            name: true
          }
        }
      }
    })
    if(!cohort) return {status: 400, result: "ERROR: no cohort with id: " + metadata.cohortId}

    let username = await getUsername(metadata.userId)

    if(!username) return res.status(400).send('ERROR: Cannot find user: ' + metadata.userId)

    let gettingStarted = await getTaggedPost(cohort.category_id, 'getting-started')

    let origin = (new URL(req.headers.referer || '')).origin
    await Promise.all([
      prisma.people_in_cohorts.create({data: {
        people: {connect: {id: metadata.userId}},
        course_cohorts: {connect: {id: cohortId}}
      }}),

      addMember(cohort.group_id, username),
      sendCohortEnrollmentEmail(person.email, {
        name: person.display_name || person.username,
        course_start_date: prettyDate(cohort.start_date),
        course_name: cohort.courses.name,
        cohort_page_url: `https://hyperlink.academy/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.category_id}`,
        get_started_topic_url: `https://forum.hyperlink.academy/t/${gettingStarted.id}`
      }),
      sendEnrollNotificationEmaill(cohort.people.email, {
        learner: person.display_name || person.username,
        course: cohort.courses.name,
        cohort_page_url: `${origin}/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohort.id}`,
        cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.courses.category_id}`,
      })
    ])

  }

  res.status(200).end()
}
