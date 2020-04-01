import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});

export type Msg = {
  instanceID:string
}

export type Response = {sessionId: string}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.instanceID) return res.status(403).end()

  let user = getToken(req)
  if(!user) return res.status(403).end()

  let prisma = new PrismaClient()

  let instance = await prisma.course_instances.findOne({where: {id: msg.instanceID}})
  await prisma.disconnect()
  if(!instance) return res.status(403).end()

  console.log(instance)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      name: instance.course,
      amount: instance.cost * 100,
      currency: 'usd',
      quantity: 1,
    }],
    cancel_url: `${req.headers.origin}/courses/${instance.course}`,
    success_url: `${req.headers.origin}/courses/${instance.course}/?success`,
    customer_email: user.email,
    metadata: {
      instanceId: instance.id
    }
  });

  return res.json({sessionId: session.id})
}
