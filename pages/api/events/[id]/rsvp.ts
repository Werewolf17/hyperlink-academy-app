import {PrismaClient} from '@prisma/client'
import { sendEventRSVPEmail } from 'emails'
import { APIHandler, Request, ResultType } from "src/apiHelpers"
import { stripe, StripePaymentMetaData } from 'src/stripe'
import { getToken } from "src/token"
import { prettyDate } from 'src/utils'

let prisma = new PrismaClient()

export default APIHandler(POSTEventRSVP)

export type EventRSVPResult = ResultType<typeof POSTEventRSVP>
async function POSTEventRSVP(req:Request){
  let user = getToken(req)
  if(!user) return {status:400, result:"ERROR: no user logged in"} as const

  let eventId = parseInt(req.query.id as string)
  if(Number.isNaN(eventId)) return {status: 400, result: "ERROR: event id is not a number"} as const
  let event = await prisma.standalone_events.findOne({where:{event: eventId}, select:{
    cost: true,
    max_attendees: true,
    events:{
      select:{
        name: true,
        id: true,
        start_date: true,
        people_in_events: true
      }
    }
  }})
  if(!event) return {status:404, result: "ERROR: no event found"} as const

  if(event.events.people_in_events.find(x=>x.person === user?.id)) {
    return {status:400, result: "ERROR: user is already enrolled"} as const
  }

  if(event.cost == 0) {
    await Promise.all([
      sendEventRSVPEmail(user.email, {
        name: user.display_name || user.username,
        event_page_url: `https://hyperlink.academy/events/${event.events.id}`,
        event_start_date: prettyDate(event.events.start_date),
        event_name: event.events.name
      }),
      prisma.people_in_events.create({
        data: {
          events: {connect:{id: event.events.id}},
          people: {connect:{id: user.id}}
        }
      })
    ])
    return {status: 200, result: {enrolled: true}} as const
  }

  let metadata: StripePaymentMetaData = {
    type: 'event',
    eventId: eventId.toString(),
    userId: user.id,
  }


  let origin = (new URL(req.headers.referer || '')).origin
  let session = await stripe.checkout.sessions.create({
    metadata,
    payment_method_types: ['card'],
    payment_intent_data: {
      transfer_group: 'event-'+eventId.toString()
    },
    line_items: [{
      name: event.events.name,
      amount: event.cost * 100,
      currency: "usd",
      quantity: 1
    }],
    cancel_url: `${origin}/events/${eventId}`,
    success_url: `${origin}/events/${eventId}/?success`,
  })

  return {
    status: 200,
    result: {sessionId: session.id}
  } as const


}
