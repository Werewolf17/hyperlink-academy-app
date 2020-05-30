import { PrismaClient} from '@prisma/client'
import { multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import { getToken } from '../../../src/token'


export type CourseResult = ResultType<typeof getCourses>
export type CourseDataResult = ResultType<typeof getCourseData>
export type InstanceResult = ResultType<typeof getInstanceData>
export type UserInstancesResult = ResultType<typeof getUserInstances>
export type WhoAmIResult = ResultType<typeof whoami>
export type ProfileResult = ResultType<typeof getProfileData>
export type CheckUsernameResult = ResultType<typeof checkUsername>

let prisma = new PrismaClient()

export default multiRouteHandler('item', {
  'courses': getCourses,
  'course': getCourseData,
  'user_instances': getUserInstances,
  'username': checkUsername,
  'whoami': whoami,
  'instance': getInstanceData,
  'profile': getProfileData
})

export const courseDataQuery = (id:string, email?:string) => prisma.courses.findOne({
  where: {id },
  include: {
    course_maintainers: {
      include: {
        people: {select: {display_name: true}}
      }
    },
    course_instances: {
      include: {
        courses: {
          select: {
            name: true
          }
        },
        people: {
          select: {
            display_name: true,
            username: true
          }
        },
        people_in_instances: {
          select: {
            people: {
              select: {
                id: true
              }
            }
          }
        }
      }
    },
    course_invites: {
      where: {
        email: email || 'no email'
      }
    }
  }
})

async function getCourseData(req: Request) {
  let user = getToken(req)
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no course id provided'} as const
  let data = await courseDataQuery(id, user?.email)

  if(!data) return {status: 403, result: `ERROR: no course with id ${id} found`} as const
  return {status:200, result: data} as const
}

export const instanceDataQuery = (id: string)=>prisma.course_instances.findOne({
    where: {id},
    select: {
      start_date: true,
      id: true,
      completed: true,
      people: {
        select: {display_name: true, username: true}
      },
      courses: {
        select: {name: true, id: true, cost: true, duration: true, description: true}
      },
      people_in_instances: {
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

async function getInstanceData(req: Request) {
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no instance id provided'} as const

  let data = await instanceDataQuery(id)
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
        take: 1
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
  let course_instances = await prisma.course_instances.findMany({
    where:{
      people_in_instances: {some: {person_id: token.id}}
    },
    include:{
      courses: {select: {name: true}},
      people: {
        select: {
          display_name: true,
          username: true,
        }
      }
    },
  })
  let invited_courses = await prisma.courses.findMany({
    where:{
      course_invites: {
        some: {
          email: token.email
        }
      }
    }
  })
  await prisma.disconnect()
  return {status: 200, result: {course_instances, invited_courses}} as const
}

async function whoami(req:Request) {
  let token = getToken(req)
  return {status: 200, result: token || false } as const
}

async function checkUsername(req:Request){
  let username = req.query.item[1]
  let headers = {"Cache-Control": 's-maxage=60000, stale-while-revalidate'}
  return !!await prisma.people.findOne({where:{username}, select:{username: true}})
    ? {status: 200, result: '', headers} as const
    : {status: 404, result: '', headers} as const
}
