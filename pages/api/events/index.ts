import { ResultType, APIHandler, Request} from 'src/apiHelpers'
import * as t from 'runtypes'
import { getToken } from 'src/token'
import {PrismaClient} from '@prisma/client'
let prisma = new PrismaClient()

export default APIHandler(createEvent)
export type CreateEventMsg = t.Static<typeof CreateEventValidator>
export type CreateEventResponse = ResultType<typeof createEvent>

let CreateEventValidator = t.Record({
  start_date: t.String,
  end_date: t.String,
  description: t.String,
  location: t.String,
  name: t.String,
  cohort: t.Number
})

async function createEvent(req:Request) {
  let msg
  try {msg = CreateEventValidator.check(req.body)}
  catch(e) {return {status:400, result:e.toString()} as const }

  let user = getToken(req)
  if(!user) return {status: 401 , result: "ERROR: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({where: {id: msg.cohort}, select:{facilitator: true}})
  if(!cohort) return {status: 404, result: `ERROR: no cohort with id ${msg.cohort} found`} as const
  if(cohort.facilitator !== user.id) return {status: 401, result: "ERROR: user is not a facilitator of the cohort"} as const

  let event = await prisma.cohort_events.create({
    select: {
      events: true
    },
    data: {
      course_cohorts: {
        connect: {
          id: msg.cohort
        }
      },
      events: {
        create: {
          start_date: msg.start_date,
          end_date: msg.end_date,
          name: msg.name,
          location: msg.location,
          description: msg.description,
        }
      }
    }
  })
  return  {status: 200, result: event} as const
}
