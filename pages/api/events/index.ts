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
  cohort: t.Number,
  people: t.Union(t.Undefined, t.Array(t.String))
})

async function createEvent(req:Request) {
  let msg
  try {msg = CreateEventValidator.check(req.body)}
  catch(e) {return {status:400, result:e.toString()} as const }

  let user = getToken(req)
  if(!user) return {status: 401 , result: "ERROR: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({where: {id: msg.cohort}, select:{facilitator: true, people: {select:{username: true}},people_in_cohorts: {select:{people: {select: {username: true}}}}}})
  if(!cohort) return {status: 404, result: `ERROR: no cohort with id ${msg.cohort} found`} as const

  if(cohort.facilitator !== user.id &&
    !cohort.people_in_cohorts.find(p=>user&&p.people.username===user.username)) return {status: 401, result: "ERROR: user is not enrolled or a facilitator of the cohort"} as const
  if(msg.people){
    for(let username of msg.people) {
      if(!cohort.people_in_cohorts.find(p=>p.people.username === username) && username !== cohort.people.username) return {status:400, result: `ERROR: can't add person who is not part of the cohort or facilitator`} as const
    }
  }

  let event = await prisma.cohort_events.create({
    include: {
      events: {
        include: {
          people_in_events: {select:{people:{select:{username: true, display_name: true}}}},
        }
      }
    },
    data: {
      everyone: msg.people ? msg.people.length === 0 : true,
      course_cohorts: {
        connect: {
          id: msg.cohort
        }
      },
      events: {
        create: {
          people:{connect:{id: user.id}},
          people_in_events: !msg.people ? undefined : {
            create: msg.people.map(p=>{
              return {people:{connect:{username: p}}}
            })
          },
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
