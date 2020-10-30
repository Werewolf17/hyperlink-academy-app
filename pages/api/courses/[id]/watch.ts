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
    await prisma.watching_courses.upsert({
      where: {
        email_course:{
          course:courseId,
          email: user.email
        }
      },
      create: {
        courses: {
          connect: {
            id: courseId
          }
        },
        email: user.email
      },
      update: {
        courses: {
          connect: {
            id: courseId
          }
        },
        email: user.email
      }
    })
  }
  else {
    await prisma.watching_courses.delete({
      where: {
        email_course: {
          course: courseId,
          email: user.email,
        }
      }
    })
  }

  return {status: 200, result: ""}
}
