import {APIHandler, ResultType, Request} from '../../../src/apiHelpers'
import {PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});

export type EnrollMsg = {
  instanceID:string
}

export type EnrollResponse= ResultType<typeof handler>

let prisma = new PrismaClient({
  forceTransactions: true
})

export default APIHandler(handler)

async function handler (req: Request) {
  let msg = req.body as Partial<EnrollMsg>
  if(!msg.instanceID) return {status: 400, result: "Error: invalid request, missing instanceID"} as const

  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const

  let instance = await prisma.course_instances.findOne({
    where: {id: msg.instanceID},
    include: {
      courses: {
        select: {
          cost: true
        }
      }
    }
  })
  await prisma.disconnect()
  if(!instance || !instance.courses.cost) return {status: 400, result: "Error: no instance with id " + msg.instanceID + " found"}  as const

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      name: instance.course,
      amount: instance.courses.cost * 100,
      currency: 'usd',
      quantity: 1,
    }],
    cancel_url: `${req.headers.origin}/courses/${instance.course}`,
    success_url: `${req.headers.origin}/courses/${instance.course}?success`,
    customer_email: user.email,
    metadata: {
      instanceId: instance.id,
      userId: user.id
    }
  });

  return {
    status: 200,
    result: {sessionId: session.id}
  } as const
}
