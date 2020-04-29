import { PrismaClient} from '@prisma/client'
import { multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import { getToken } from '../../../src/token'


export type CourseResult = ResultType<typeof getCourses>
export type CourseDataResult = ResultType<typeof getCourseData>
export type InstanceResult = ResultType<typeof getUserInstances>
export type WhoAmIResult = ResultType<typeof whoami>

let prisma = new PrismaClient({
  forceTransactions: true
})

export default multiRouteHandler('item', {
  'courses': getCourses,
  'course': getCourseData,
  'user_instances': getUserInstances,
  'whoami': whoami
})

async function getCourseData(req: Request) {
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no course id provided'} as const
  let data = await prisma.courses.findOne({
    where: {id },
    include: {
      course_maintainers: {
        include: {
          people: {select: {display_name: true}}
        }
      },
      course_instances: {
        include: {
          people: {
            select: {
              display_name: true
            }
          }
        }
      }
    }
  })

  if(!data) return {status: 403, result: `ERROR: no course with id ${id} found`} as const
  return {status:200, result: data} as const
}

async function getCourses() {
  let args = {
    include: {
      course_instances: {
        select: {
          start_date: true as const
        },
        orderBy: {
          start_date: "asc" as const
        },
        first: 1
      }
    }
  }
  let courses= await prisma.courses.findMany<typeof args>(args)
  return {status: 200, result: {courses}} as const
}

async function getUserInstances(req:Request) {
  let token = getToken(req)
  if(!token) return {status: 403 as const, result: "Error: no user logged in"}
  let course_instances = await prisma.course_instances.findMany({where:{
    people_in_instances: {some: {person_id: token.id}}
  }})
  await prisma.disconnect()
  return {status: 200, result: {course_instances}} as const
}

async function whoami(req:Request) {
  let token = getToken(req)
  return {status: 200, result: token || false } as const
}
