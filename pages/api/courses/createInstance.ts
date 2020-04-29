import {APIHandler, ResultType, Request} from '../../../src/apiHelpers'
import { PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import {createInstanceGroup} from '../../../src/discourse'

export type CreateInstanceMsg = {
  courseId: string,
  start: string,
  end: string,
  facillitator: string,
}

export type CreateInstanceResponse = ResultType<typeof handler>

let prisma = new PrismaClient({
  forceTransactions: true
})

export default APIHandler(handler)

async function handler (req: Request) {
  let msg = req.body as Partial<CreateInstanceMsg>
  if(!msg.courseId || !msg.start ||
     !msg.end || !msg.facillitator) return {status: 400, result: "Error: invalid request, missing parameters"} as const

  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const

  let course= await prisma.courses.findOne({
    where: {id: msg.courseId},
    include:{
      course_instances: {
        select: {id: true}
      }
    }
  })
  await prisma.disconnect()
  if(!course) return {status: 400, result: "ERROR: no course found with that id"} as const

  let id = course.id + '-' + course.course_instances.length
  try {
    await prisma.course_instances.create({
      data: {
        id,
        end_date: msg.end,
        start_date: msg.start,
        courses: {
          connect: {
            id: course.id
          }
        },
        people: {
          connect: {
            id: msg.facillitator
          }
        }
      }
    })

    await createInstanceGroup(id, msg.facillitator)
  }
  catch(e) {
    console.log(e)
    return {status: 401, result: e} as const
  }

  return {status: 200, result: 'created course' } as const
}
