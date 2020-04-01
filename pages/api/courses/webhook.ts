import { NextApiRequest, NextApiResponse} from 'next'
import Stripe from 'stripe'
import {PrismaClient} from '@prisma/client'
import fetch from 'isomorphic-unfetch'

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
  try {
    if (event.type === 'checkout.session.completed') {
      const {customer_email, metadata} = event.data.object as {customer_email:string, metadata: {instanceId:string}} ;
      console.log(event.data.object)
      let user = await prisma.people.findOne({where: {email: customer_email}, select:{id: true}})

      console.log(user)
      let {instanceId} = metadata

      console.log(instanceId)

      if(!user || !instanceId) return res.status(400).end()

      await prisma.people_in_instances.create({data: {
        people:{connect: {id:user.id}},
        course_instances: {connect: {id: instanceId}}
      }})

      let discourseRes = await fetch('https://forum.hyperlink.academy/u/by-external/' + user.id + '.json', {
        method: "GET",
        headers: {
          "Api-Key": process.env.DISCOURSE_API_KEY || '',
          "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
        }
      })

      console.log('request-result', discourseRes)

      await fetch('https://forum.hyperlink.academy/groups/' + instanceId + '/members.json', {
        method: "PUT",
        headers: {
          "Api-Key": process.env.DISCOURSE_API_KEY || '',
          "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
          "Content-Type": 'application/json',
        },
        body: JSON.stringify({
          usernames: (await discourseRes.json()).username
        })
      })

    }

  res.status(200).end()
  }
  catch(e) {
    console.log(e)
    return res.status(400).send(e.message)
  }
}
