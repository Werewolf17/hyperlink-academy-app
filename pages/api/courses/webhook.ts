import { NextApiRequest, NextApiResponse} from 'next'
import Stripe from 'stripe'
import {PrismaClient} from '@prisma/client'
import { getUsername, getGroupId, addMember} from '../../../src/discourse'

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
    const {metadata} = event.data.object as {customer_email:string, metadata: {instanceId:string, userId:string}} ;

    let username = await getUsername(metadata.userId)
    let groupId = await getGroupId(metadata.instanceId)

    if(!username || !groupId) return res.status(400).send('ERROR: Cannot find user or group id')

    await prisma.people_in_instances.create({data: {
      people: {connect: {id: metadata.userId}},
      course_instances: {connect: {id: metadata.instanceId}}
    }})
    await prisma.disconnect()

    await addMember(groupId, username)

  }

  res.status(200).end()
}
