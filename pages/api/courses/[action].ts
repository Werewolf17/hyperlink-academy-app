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
  prerequisites: string
  maintainers: string[]
}
export type CreateCourseResponse = ResultType<typeof createCourse>

export type UpdateCourseMsg = {
  id: string
  prerequisites?: string
  duration?: string
  description: string
}
export type UpdateCourseResponse = ResultType<typeof updateCourse>

export type CompleteInstanceMsg = {
  instanceId: string
}
export type CompleteInstanceResponse = ResultType<typeof completeInstance>

export default multiRouteHandler('action', {
  createInstance,
  enroll,
  createCourse,
  updateCourse,
  completeInstance
})

async function completeInstance(req:Request) {
  let msg = req.body as Partial<CompleteInstanceMsg>
  if(!msg.instanceId) return {status: 400, result: "Error: invalid request, missing parameters"} as const
  let completed = (new Date()).toISOString()
  let newData = await prisma.course_instances.update({
    where: {id:msg.instanceId},
    data: {
      completed
    }
  })
  if(!newData) return {status: 404, result: `No instance with id ${msg.instanceId} found`} as const
  return {status:200, result: {completed}} as const
}

async function createInstance(req: Request) {
  let msg = req.body as Partial<CreateInstanceMsg>
  if(!msg.courseId || !msg.start ||
     !msg.facillitator) return {status: 400, result: "Error: invalid request, missing parameters"} as const

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
      course_instances: {
        select: {id: true}
      }
    },
  })
  if(!course) return {status: 400, result: "ERROR: no course found with that id"} as const

  let id = course.id + '-' + course.course_instances.length
  try {
    let instance = await prisma.course_instances.create({
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
            id: msg.facillitator
          }
        }
      }
    })

    await createInstanceGroup(id, msg.facillitator, course.category_id)
    return {status: 200, result: instance} as const
  }
  catch(e) {
    console.log(e)
    return {status: 401, result: e} as const
  }

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
          cost: true,
          name: true
        }
      }
    }
  })
  await prisma.disconnect()
  if(!instance || !instance.courses.cost) return {status: 400, result: "Error: no instance with id " + msg.instanceID + " found"}  as const

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      name: instance.courses.name,
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
     || !msg.duration || !msg.description || !msg.maintainers || !msg.prerequisites) return {status: 400, result: "ERROR: missing parameters"} as const
  let user = getToken(req)
  if(!user) return {status: 403, result: "ERROR: no user logged in"} as const

  let isAdmin = prisma.admins.findOne({where: {person: user.id}})
  if(!isAdmin) return {status: 403, result: "ERROR: user is not an admin"} as const

  let category_id = await createCategory(msg.name, {id: msg.courseId})
  if(!category_id) return {status: 500, result: "ERROR: couldn't create course category"}

  await prisma.courses.create({
    data: {
      category_id,
      id: msg.courseId,
      name: msg.name,
      description: msg.description,
      duration: msg.duration,
      prerequisites: msg.prerequisites,
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
  return {status:200, result: "Course created"}
}

async function updateCourse(req: Request) {
  let msg = req.body as Partial<UpdateCourseMsg>
  if(!msg.id) return {status: 400, result: "ERROR: No course id provided"} as const
  let user = getToken(req)
  if(!user) return {status: 403, result: "ERROR: No user logged in"} as const
  let isMaintainer = await prisma.people.findOne({
    where:{id: user.id},
    select: {
      course_maintainers: {where: {course: msg.id}}
    }
  })

  console.log(isMaintainer)

  if(!isMaintainer || isMaintainer.course_maintainers.length === 0) return {
    status: 403,
    result: `ERROR: user is not maintainer of course ${msg.id}`
  } as const

  let newData = await prisma.courses.update({
    where: {id: msg.id},
    data: {
      duration: msg.duration,
      prerequisites: msg.prerequisites,
      description: msg.description
    }
  })

  return {status: 200, result: {prerequisites: newData.prerequisites, duration: newData.duration}} as const
}
