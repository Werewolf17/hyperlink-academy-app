import { PrismaClient} from '@prisma/client'
import { multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import { getToken } from '../../../src/token'


export type CourseResult = ResultType<typeof getCourses>
export type CourseDataResult = ResultType<typeof getCourseData>
export type CohortResult = ResultType<typeof getCohortData>
export type UserCohortsResult = ResultType<typeof getUserCohorts>
export type UserCoursesResult = ResultType<typeof getUserCourses>
export type WhoAmIResult = ResultType<typeof whoami>
export type ProfileResult = ResultType<typeof getProfileData>
export type CheckUsernameResult = ResultType<typeof checkUsername>

let prisma = new PrismaClient()

export default multiRouteHandler('item', {
  'courses': getCourses,
  'course': getCourseData,
  'user_cohorts': getUserCohorts,
  'user_courses': getUserCourses,
  'username': checkUsername,
  'whoami': whoami,
  'cohort': getCohortData,
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
    course_cohorts: {
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
        people_in_cohorts: {
          select: {
            people: {
              select: {
                id: true
              }
            }
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

export const cohortDataQuery = (id: string)=>prisma.course_cohorts.findOne({
    where: {id},
    select: {
      start_date: true,
      id: true,
      live: true,
      completed: true,
      people: {
        select: {display_name: true, username: true}
      },
      courses: {
        select: {name: true, id: true, cost: true, duration: true, description: true}
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
  let id = req.query.item[1]
  if(!id) return {status: 400, result: 'ERROR: no cohort id provided'} as const

  let data = await cohortDataQuery(id)
  if(!data) return {status: 404, result: `Error: no cohort with id ${id} found`} as const
  return {status: 200, result: data} as const
}

export const profileDataQuery = (username: string)=>{
  return prisma.people.findOne({
    where: {username: username.toLowerCase()},
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
  where: {status: "live"},
  include: {
    course_cohorts: {
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

async function getUserCohorts(req:Request) {
  let token = getToken(req)
  if(!token) return {status: 403 as const, result: "Error: no user logged in"}
  let course_cohorts = await prisma.course_cohorts.findMany({
    where:{
      OR: [
        {people_in_cohorts: {some: {person: token.id}}},
        {facilitator: token.id}
      ]
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
  return {status: 200, result: {course_cohorts, invited_courses}} as const
}
async function getUserCourses(req: Request) {
  let token = getToken(req)
  if(!token) return {status: 403 as const, result: "Error: no user logged in"}

  let maintaining_courses = await prisma.courses.findMany({
    where: {
      course_maintainers: {
        some: {
          maintainer: token.id
        }
      }
    }
  })
  return {status: 200, result: {maintaining_courses}} as const
}

async function whoami(req:Request) {
  let token = getToken(req)
  return {status: 200, result: token || false } as const
}

async function checkUsername(req:Request){
  let username = req.query.item[1]
  let headers = {"Cache-Control": 's-maxage=60000, stale-while-revalidate'}
  return !!await prisma.people.findOne({where:{username: username.toLowerCase()}, select:{username: true}})
    ? {status: 200, result: '', headers} as const
    : {status: 404, result: '', headers} as const
}
