import { Request, ResultType, APIHandler} from "../../../../src/apiHelpers"
import { PrismaClient } from "@prisma/client"
import { getToken } from "src/token"
let prisma = new PrismaClient()

export type WatchCourseMsg = {
  watching: boolean
}
export type WatchCourseResult = ResultType<typeof watchCourse>

export default APIHandler(watchCourse)

async function watchCourse(req:Request) {
  let msg = req.body as Partial<WatchCourseMsg>
  console.log(msg)
  let courseId = parseInt(req.query.id as string)
  if(Number.isNaN(courseId)) return {status: 400, result: "ERROR: Course id is not a number"} as const
  let user = getToken(req)
  if(!user) return {status: 403, result: "ERROR: No user logged in"} as const
  if(typeof msg.watching !== 'boolean') return {status: 400, result: "ERROR: no watching property on request"} as const

  if(msg.watching === true) {
    await prisma.people_watching_courses.upsert({
      where: {
        course_person: {
          course: courseId,
          person: user.id,
        }
      },
      create: {
        courses: {
          connect: {
            id: courseId
          }
        },
        people: {
          connect: {id: user.id}
        }
      },
      update: {
        courses: {
          connect: {
            id: courseId
          }
        },
        people: {
          connect: {id: user.id}
        }
      }
    })
  }
  else {
    await prisma.people_watching_courses.delete({
      where: {
        course_person: {
          course: courseId,
          person: user.id,
        }
      }
    })
  }

  return {status: 200, result: ""}
}
