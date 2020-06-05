import { ResultType, Request, multiRouteHandler} from '../../../src/apiHelpers'
import { PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import { createCohortGroup, createCategory, createTopic, addMember, getGroupId} from '../../../src/discourse'
import Stripe from 'stripe'
import { sendInviteToCourseEmail, sendCohortEnrollmentEmail } from '../../../emails'
import TemplateCourseDescription from '../../../writing/TemplateCourseDescription.txt'

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
let prisma = new PrismaClient()

export type CreateCohortMsg = {
  courseId: string,
  start: string,
  facillitator: string,
}
export type CreateCohortResponse = ResultType<typeof createCohort>

export type EnrollMsg = { cohortId:string}
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

export type CompleteCohortMsg = {
  cohortId: string
}
export type CompleteCohortResponse = ResultType<typeof completeCohort>

export type InviteToCourseMsg = {course: string}
  & ({ email: string, username: undefined} | {username: string, email: undefined})
export type InviteToCourseResponse = ResultType<typeof inviteToCourse>

export default multiRouteHandler('action', {
  createCohort,
  enroll,
  createCourse,
  updateCourse,
  completeCohort,
  inviteToCourse
})

async function completeCohort(req:Request) {
  let msg = req.body as Partial<CompleteCohortMsg>
  if(!msg.cohortId) return {status: 400, result: "Error: invalid request, missing parameters"} as const
  let completed = (new Date()).toISOString()
  let newData = await prisma.course_cohorts.update({
    where: {id:msg.cohortId},
    data: {
      completed
    }
  })
  if(!newData) return {status: 404, result: `No cohort with id ${msg.cohortId} found`} as const
  return {status:200, result: {completed}} as const
}

async function createCohort(req: Request) {
  let msg = req.body as Partial<CreateCohortMsg>
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
      course_cohorts: {
        select: {id: true}
      }
    },
  })
  if(!course) return {status: 400, result: "ERROR: no course found with that id"} as const

  let id = course.id + '-' + course.course_cohorts.length
  if(!(await createCohortGroup(id, msg.facillitator, course.category_id))){
    return {status: 500, result: "ERROR: unable to create cohort group"} as const
  }

  try {
    let cohort = await prisma.course_cohorts.create({
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

    return {status: 200, result: cohort} as const
  }
  catch(e) {
    console.log(e)
    return {status: 501, result: e} as const
  }

}

async function enroll (req: Request) {
  let msg = req.body as Partial<EnrollMsg>
  if(!msg.cohortId) return {status: 400, result: "Error: invalid request, missing cohortId"} as const

  let user = getToken(req)
  if(!user) return {status: 403, result: "Error: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({
    where: {id: msg.cohortId},
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
  if(!cohort || cohort.courses.cost === undefined) return {status: 400, result: "Error: no cohort with id " + msg.cohortId + " found"}  as const

  if(cohort.courses.cost === 0) {
    let groupId = await getGroupId(msg.cohortId)

    await prisma.people_in_cohorts.create({data: {
      people: {connect: {id: user.id}},
      course_cohorts: {connect: {id: msg.cohortId}}
    }})

    await addMember(groupId, user.username)
    await sendCohortEnrollmentEmail(user.email, {
      name: user.display_name || user.username,
      course_start_date: cohort.start_date,
      course_name: cohort.courses.name,
      cohort_page_url: `https://hyperlink.academy/${cohort.course}/${cohort.id}`,
      cohort_forum_link: `https://forum.hyperlink.academy/c/${cohort.course}/${cohort.id}`,
      get_started_topic_url: 'PLACEHOLDER'
    })
    return {
      status: 200,
      result: {zeroCost: true} as const
    }
  }

  else {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        name: cohort.courses.name,
        amount: cohort.courses.cost * 100,
        currency: 'usd',
        quantity: 1,
      }],
      cancel_url: `${req.headers.origin}/courses/${cohort.course}/${cohort.id}`,
      success_url: `${req.headers.origin}/courses/${cohort.course}/${cohort.id}?welcome`,
      customer_email: user.email,
      metadata: {
        cohortId: cohort.id,
        userId: user.id
      }
    });

    return {
      status: 200,
      result: {sessionId: session.id}
    } as const
  }
}

async function createCourse(req: Request) {
  let msg = req.body as Partial<CreateCourseMsg>
  if(!msg.courseId || !msg.cost ||!msg.name
     || !msg.duration || !msg.description || !msg.maintainers || !msg.prerequisites) return {status: 400, result: "ERROR: missing parameters"} as const
  let user = getToken(req)
  if(!user) return {status: 403, result: "ERROR: no user logged in"} as const

  let isAdmin = prisma.admins.findOne({where: {person: user.id}})
  if(!isAdmin) return {status: 403, result: "ERROR: user is not an admin"} as const

  let category = await createCategory(msg.name, {id: msg.courseId})
  if(!category) return {status: 500, result: "ERROR: couldn't create course category"}
  await createTopic({
    category,
    title: `${msg.name} Curriculum`,
    tags: ['curriculum'],
    raw: TemplateCourseDescription
  })

  await prisma.courses.create({
    data: {
      category_id: category,
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

async function inviteToCourse(req:Request) {
  let msg = req.body as Partial<InviteToCourseMsg>
  if(!msg.course) return {status:400, result: "ERROR: no course id specified"} as const
  if(!msg.email && !msg.username) return {status: 400, result: "ERROR: Must include username or email"} as const

  let email = msg.email || ''
  let name = ''
  if(msg.username) {
    let person = await prisma.people.findOne({where: {username: msg.username}, select:{email: true, display_name: true}})
    if(!person) return {status: 404, result: `no user with username ${msg.username} found`} as const
    email = person.email
    name = person.display_name || ''
  }

  let courseData = await prisma.courses.findOne({where: {id: msg.course}, select:{name: true}})
  if(!courseData) return {status:404, result: `ERROR: no course found with id ${msg.course}`}

  await prisma.course_invites.create({data: {
    email,
    courses: {
      connect: {
        id: msg.course
      }
    }
  }})

  await sendInviteToCourseEmail(email, {
    course_url: `https://hyperlink.academy/courses/${msg.course}`,
    course_name: courseData.name,
    name
  })

  return {status: 200, result: {email}} as const
}
