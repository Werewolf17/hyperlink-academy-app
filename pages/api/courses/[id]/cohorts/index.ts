import {APIHandler, Request, ResultType} from '../../../../../src/apiHelpers'
import { PrismaClient } from '@prisma/client'
import { getToken } from '../../../../../src/token'
import { getUsername, createGroup, createCategory, updateTopic, createTopic, updateCategory } from '../../../../../src/discourse'
import TemplateCohortNotes from '../../../../../writing/TemplateCohortNotes.txt'
import TemplateCohortGettingStarted from '../../../../../writing/TemplateCohortGettingStarted.txt'

let prisma = new PrismaClient()

export type CreateCohortMsg = {
  courseId: string,
  start: string,
  facilitator: string,
}
export type CreateCohortResponse = ResultType<typeof handler>

export default APIHandler(handler)

async function handler (req: Request) {
  let msg = req.body as Partial<CreateCohortMsg>
  if(!msg.courseId || !msg.start ||
    !msg.facilitator) return {status: 400, result: "Error: invalid request, missing parameters"} as const

  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const
  let isUserMainter = await prisma.course_maintainers.findOne({where: {
    course_maintainer: {
      course: msg.courseId,
      maintainer: user.id
    }
  }})
  if(!isUserMainter) {
    await prisma.disconnect()
    return {status: 403, result: "ERROR: user is not maintainer of course"} as const
  }

  let course = await prisma.courses.findOne({
    where: {id: msg.courseId},
    select: {
      id: true,
      category_id: true,
      name: true,
      status: true,
      course_cohorts: {
        select: {id: true}
      }
    },
  })
  if(!course) return {status: 400, result: "ERROR: no course found with that id"} as const

  let id = course.id + '-' + course.course_cohorts.length
  let admin = await getUsername(msg.facilitator)
  if(!admin) return {status: 404, result: "ERROR: no user found with id: " + msg.facilitator} as const
  await createGroup({name: id, visibility_level:2, owner_usernames: admin})

  // If the course is in draft status it's category will be private so we need
  // to explicitly add the cohort group
  if(course.status === 'draft') {
    await updateCategory(course.category_id, {name: course.name, permissions: {
      // Make sure to keep any existing cohorts as well
      ...course.course_cohorts.reduce((acc, cohort) => {
        acc[cohort.id] = 1
        return acc
      }, {} as {[i:string]:number}),
      [id]: 1,
      [course.id + '-m']: 1
    }})
  }
  let category = await createCategory(id, {permissions: {[id]:1}, parent_category_id: course.category_id})
  if(!category) return {status: 500, result: "ERROR: Could not create cohort category"} as const
  await updateTopic(category.topic_url, {
    category_id: category.id,
    title: id + " Notes",
    raw: TemplateCohortNotes,
    tags: ['note']
  }, admin)

  await createTopic({
    category: category.id,
    title: id + " Getting Started",
    raw: TemplateCohortGettingStarted,
    tags: ['getting-started']
  }, admin)

  let cohort = await prisma.course_cohorts.create({
    include: {
      people: {select: {display_name: true, username: true}}
    },
    data: {
      id,
      start_date: msg.start,
      courses: {
        connect: {
          id: course.id
        }
      },
      people: {
        connect: {
          id: msg.facilitator
        }
      }
    }
  })

  return {status: 200, result: cohort} as const
}
