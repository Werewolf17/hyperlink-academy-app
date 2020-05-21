import { PrismaClient} from '@prisma/client'
import { multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import { getToken } from '../../../src/token'


export type CourseResult = ResultType<typeof getCourses>
export type CourseDataResult = ResultType<typeof getCourseData>
export type InstanceResult = ResultType<typeof getInstanceData>
export type UserInstancesResult = ResultType<typeof getUserInstances>
export type WhoAmIResult = ResultType<typeof whoami>
export type ProfileResult = ResultType<typeof getProfileData>

let prisma = new PrismaClient({
  forceTransactions: true
})

export default multiRouteHandler('item', {
  'courses': getCourses,
  'course': getCourseData,
  'user_instances': getUserInstances,
  'whoami': whoami,
  'instance': getInstanceData,
  'profile': getProfileData
})

export const courseDataQuery = (id:string) => prisma.courses.findOne({
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

async function getCourseData(req: Request) {
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no course id provided'} as const
  let data = await courseDataQuery(id)

  if(!data) return {status: 403, result: `ERROR: no course with id ${id} found`} as const
  return {status:200, result: data} as const
}

async function getInstanceData(req: Request) {
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no instance id provided'} as const

  let data = await prisma.course_instances.findOne({
    where: {id},
    select: {
      start_date: true,
      people: {
        select: {display_name: true, username: true}
      },
      courses: {
        select: {name: true, id: true, cost: true, duration: true}
      },
      people_in_instances: {
        include: {
          people: {
            select: {
              display_name: true,
              username: true,
            }
          }
        }
      }
    },
  })
  if(!data) return {status: 404, result: `Error: no instance with id ${id} found`} as const
  return {status: 200, result: data} as const
}

export const profileDataQuery = (username: string)=>{
  return prisma.people.findOne({
    where: {username},
    select: {
      display_name: true,
      bio: true,
      link: true,
    }
  })
}

async function getProfileData(req:Request) {
  let username = req.query.item[1]
  if(!username) return {status: 400, result: 'ERROR: no user id provided'} as const
  let data = await profileDataQuery(username)
  if(!data) return {status: 404, result: `Error: no user with id ${username} found`} as const
  return {status: 200, result: data} as const
}

export const coursesQuery = () => prisma.courses.findMany({
    include: {
      course_instances: {
        select: {start_date: true},
        orderBy: {start_date: "asc"},
        first: 1
      }
    }
})

async function getCourses() {
  let courses = await coursesQuery()
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
