import { ResultType, Request, multiRouteHandler} from '../../../src/apiHelpers'
import { PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import {createInstanceGroup, createCategory} from '../../../src/discourse'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
let prisma = new PrismaClient({
  forceTransactions: true
})

export type CreateInstanceMsg = {
  courseId: string,
  start: string,
  end: string,
  facillitator: string,
}
export type CreateInstanceResponse = ResultType<typeof createInstance>

export type EnrollMsg = { instanceID:string}
export type EnrollResponse= ResultType<typeof enroll>

export type CreateCourseMsg = {
  courseId: string
  description: string
  name: string
  cost: number
  duration: string
  maintainers: string[]
}
export type CreateCourseResponse = ResultType<typeof createCourse>

export default multiRouteHandler('action', {
  createInstance,
  enroll,
  createCourse
})

async function createInstance(req: Request) {
  let msg = req.body as Partial<CreateInstanceMsg>
  if(!msg.courseId || !msg.start ||
     !msg.end || !msg.facillitator) return {status: 400, result: "Error: invalid request, missing parameters"} as const

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

async function enroll (req: Request) {
  let msg = req.body as Partial<EnrollMsg>
  if(!msg.instanceID) return {status: 400, result: "Error: invalid request, missing instanceID"} as const

  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const

  let instance = await prisma.course_instances.findOne({
    where: {id: msg.instanceID},
    include: {
      courses: {
        select: {
          cost: true
        }
      }
    }
  })
  await prisma.disconnect()
  if(!instance || !instance.courses.cost) return {status: 400, result: "Error: no instance with id " + msg.instanceID + " found"}  as const

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      name: instance.course,
      amount: instance.courses.cost * 100,
      currency: 'usd',
      quantity: 1,
    }],
    cancel_url: `${req.headers.origin}/courses/${instance.course}`,
    success_url: `${req.headers.origin}/courses/${instance.course}?success`,
    customer_email: user.email,
    metadata: {
      instanceId: instance.id,
      userId: user.id
    }
  });

  return {
    status: 200,
    result: {sessionId: session.id}
  } as const
}

async function createCourse(req: Request) {
  let msg = req.body as Partial<CreateCourseMsg>
  if(!msg.courseId || !msg.cost ||!msg.name
     || !msg.duration || !msg.description || !msg.maintainers) return {status: 400, result: "ERROR: missing parameters"} as const
  let user = getToken(req)
  if(!user) return {status: 403, result: "ERROR: no user logged in"} as const

  let isAdmin = prisma.admins.findOne({where: {person: user.id}})
  if(!isAdmin) return {status: 403, result: "ERROR: user is not an admin"} as const

  await prisma.courses.create({
    data: {
      id: msg.courseId,
      name: msg.name,
      description: msg.description,
      duration: msg.duration,
      cost: msg.cost,
      course_maintainers: {
        create: msg.maintainers.map(email => {
          return {people: {
            connect: {email}
          }}
        })
      }
    },
  })
  await createCategory(msg.courseId, {parent_category_id: "15"})
  return {status:200, result: "Course created"}
}
