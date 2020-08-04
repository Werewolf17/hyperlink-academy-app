import { PrismaClient } from "@prisma/client"
import { ResultType, APIHandler, Request } from "src/apiHelpers"
import { getToken } from "src/token"
import { sendWatchingNotificationEmail } from "emails"
import { prettyDate } from "src/utils"

let prisma = new PrismaClient()
export type UpdateCohortMsg = {
  data: Partial<{
    completed: true
    live: boolean
  }>
}

export type UpdateCohortResponse = ResultType<typeof updateCohort>
export type CohortResult = ResultType<typeof getCohortData>

export default APIHandler({POST: updateCohort, GET: getCohortData})
async function updateCohort(req:Request) {
  let msg = req.body as Partial<UpdateCohortMsg>
  let cohortId = parseInt(req.query.cohortId as string)
  if(Number.isNaN(cohortId)) return {status: 400, result: "ERROR: Cohort id is not a number"} as const

  if(!msg.data) return {status: 400, result: "Error: invalid request, missing data"} as const

  let user = getToken(req)
  if(!user) return {status: 400, result: "ERROR: no user logged in'"} as const
  let cohort = await prisma.course_cohorts.findOne({
    where:{id:cohortId},
    select: {
      facilitator: true,
      completed: true,
      live: true,
      start_date: true,
      course: true,
      courses: {
        select: {
          name: true,
          slug: true,
          description: true
        }
      }
    }})
  if(!cohort) return {status: 404, result: `No cohort with id ${cohortId} found`} as const
  if(cohort.facilitator !== user.id) return {status: 401, result: "ERROR: user is not a facilitator of this course"} as const

  let completed
  if(msg.data.completed && !cohort.completed) {
    completed = (new Date()).toISOString()
  }

  if(cohort.live === false && msg.data.live === true) {
    // If we're toggling a cohort live, notify those watching
    let watchers = await prisma.people_watching_courses.findMany({
      where: {course: cohort.course},
      select: {people: {select: {email: true, username: true, display_name: true}}}
    })
    await Promise.all(watchers.map(async watcher => {
      if(!cohort) return
      return sendWatchingNotificationEmail(watcher.people.email, {
        course_name: cohort.courses.name,
        cohort_page_url: `https://hyperlink.academy/courses/${cohort.courses.slug}/${cohort.course}/cohorts/${cohortId}`,
        cohort_start_date: prettyDate(cohort.start_date),
        name: watcher.people.display_name || watcher.people.username,
        course_description: cohort.courses.description
      })
    }))
  }

  let newData = await prisma.course_cohorts.update({
    where: {id: cohortId},
    data: {
      live: msg.data.live,
      completed
    }
  })
  if(!newData) return {status: 404, result: `No cohort with id ${cohortId} found`} as const
  return {status: 200, result: newData} as const
}

export const cohortDataQuery = (id: number)=>prisma.course_cohorts.findOne({
    where: {id},
    select: {
      name: true,
      category_id: true,
      start_date: true,
      id: true,
      live: true,
      completed: true,
      people: {
        select: {display_name: true, username: true}
      },
      courses: {
        select: {
          name: true,
          cohort_max_size: true,
          id: true,
          slug: true,
          cost: true,
          duration: true,
          description: true,
          category_id: true
        }
      },
      people_in_cohorts: {
        include: {
          people: {
            select: {
              display_name: true,
              username: true,
            }
          }
        },
      }
    },
})

async function getCohortData(req: Request) {
  let cohortId = parseInt(req.query.cohortId as string)
  if(Number.isNaN(cohortId)) return {status: 400, result: "ERROR: Cohort id is not a number"} as const

  let data = await cohortDataQuery(cohortId)
  if(!data) return {status: 404, result: `Error: no cohort with id ${cohortId} found`} as const
  return {status: 200, result: data} as const
}
