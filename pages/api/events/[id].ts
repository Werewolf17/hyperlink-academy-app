import { APIHandler, Request, ResultType } from "src/apiHelpers";
import { PrismaClient } from "@prisma/client";
import { getToken } from "src/token";
import * as t from 'runtypes'

let prisma = new PrismaClient()
export default APIHandler({
  POST: updateEvent,
  DELETE: deleteEvent
})
export type UpdateEventMsg = t.Static<typeof UpdateEventValidator>
export type UpdateEventResult = ResultType<typeof updateEvent>
export type DeleteEventResult = ResultType<typeof deleteEvent>

let UpdateEventValidator = t.Record({
  data: t.Partial({
    start_date: t.String,
    end_date: t.String,
    description: t.String,
    location: t.String,
    name: t.String,
    people:t.Array(t.String)
  }),
  id: t.Number,
  cohort: t.Number
})

async function updateEvent(req:Request) {
  let msg
  try {msg = UpdateEventValidator.check(req.body)}
  catch(e) {
    return {status:400, result:e.toString()} as const
  }

  let user = getToken(req)
  if(!user) return {status: 401 , result: "ERROR: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({where: {id: msg.cohort}, select:{facilitator: true}})
  if(!cohort) return {status: 404, result: `ERROR: no cohort with id ${msg.cohort} found`} as const

  let event = await prisma.events.findOne({where:{id: msg.id}, select:{created_by: true}})
  if(!event) return {status:404, result: 'ERROR: no event found'} as const

  if(cohort.facilitator !== user.id && event.created_by!==user.id) return {status: 401, result: "ERROR: user is not a facilitator of the cohort"} as const

  let newEvent = await prisma.cohort_events.update({
    where:{cohort_event:{cohort: msg.cohort, event: msg.id}},
    include: {
      events: {
        include: {
          people_in_events: {select:{people:{select:{username: true, display_name: true}}}},
        }
      }
    },
    data:{
      everyone: msg.data.people ? msg.data.people.length === 0 : undefined,
      events:{
        update:{
          start_date: msg.data.start_date,
          end_date: msg.data.end_date,
          description: msg.data.description,
          name: msg.data.name,
          people_in_events: {
            deleteMany:{event: msg.id},
            create: msg.data.people?.map(p=>{
              return {
                people:{connect:{username: p}}
              }
            })
          }
        }
      }
    }
  })
  return {status: 200, result: newEvent} as const
}

async function deleteEvent(req:Request) {
  let eventId = parseInt(req.query.id as string)
  if(Number.isNaN(eventId)) return {status: 400, result: "ERROR: Cohort id is not a number"} as const
  let user = getToken(req)
  if(!user) return {status: 401 , result: "ERROR: no user logged in"} as const

  let event = await prisma.events.findOne({
    where: {id: eventId},
    select: {
      created_by: true,
      cohort_events: {
        select:{
          course_cohorts: {
            select:{facilitator: true, people_in_cohorts:{select:{people:{select: {username: true}}}}}
          }
        }
      }
    }
  })

  if(!event) return {status: 404, result: `ERROR: no event with id ${eventId} found`} as const

  if(event.cohort_events[0]?.course_cohorts.facilitator !== user.id && user.id !== event.created_by) return {status: 401, result: "ERROR: user is not a facilitator of the cohort this event is in"} as const

  await prisma.cohort_events.deleteMany({where: {event: eventId}}),
  await prisma.people_in_events.deleteMany({where:{event: eventId}})
  await prisma.events.delete({
    where: {id: eventId}
  })
  return {status: 200, result: true}
}
