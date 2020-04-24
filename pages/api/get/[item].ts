import { PrismaClient} from '@prisma/client'
import { multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import { getToken } from '../../../src/token'


export type CourseResult = ResultType<typeof getCourses>
export type InstanceResult = ResultType<typeof getUserInstances>
export type WhoAmIResult = ResultType<typeof whoami>

let prisma = new PrismaClient({
  forceTransactions: true
})

export default multiRouteHandler('item', {
  'courses': getCourses,
  'user_instances': getUserInstances,
  'whoami': whoami
})

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
