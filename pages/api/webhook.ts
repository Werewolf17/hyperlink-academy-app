import { NextApiRequest, NextApiResponse} from 'next'
import Stripe from 'stripe'
import {PrismaClient} from '@prisma/client'
import { getUsername, getGroupId, addMember} from '../../src/discourse'
import { sendCohortEnrollmentEmail } from '../../emails';

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

    let person = await prisma.people.findOne({where: {id: metadata.userId}})
    if(!person) return {status: 400, result: "ERROR: cannot find user with id: " + metadata.userId} as const

    let cohort = await prisma.course_cohorts.findOne({
      where: {id: metadata.cohortId},
      include: {
        courses: {
          select: {
            name: true
          }
        }
      }
    })
    if(!cohort) return {status: 400, result: "ERROR: no cohort with id: " + metadata.cohortId}

    let username = await getUsername(metadata.userId)
    let groupId = await getGroupId(metadata.cohortId)

    if(!username || !groupId) return res.status(400).send('ERROR: Cannot find user or group id, with metadata: ' + JSON.stringify(metadata))

    await prisma.people_in_cohorts.create({data: {
      people: {connect: {id: metadata.userId}},
      course_cohorts: {connect: {id: metadata.cohortId}}
    }})
    await prisma.disconnect()


    await addMember(groupId, username)
    await sendCohortEnrollmentEmail(person.email, {
      name: person.display_name || person.username,
      course_start_date: cohort.start_date,
      course_name: cohort.courses.name,
      cohort_page_url: `https://hyperlink.academy/${cohort.course}/${cohort.id}`,
      cohort_forum_link: `https://forum.hyperlink.academy/c/${cohort.course}/${cohort.id}`,
      get_started_topic_url: 'PLACEHOLDER'
    })

  }

  res.status(200).end()
}
