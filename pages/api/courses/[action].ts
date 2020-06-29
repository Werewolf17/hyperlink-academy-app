import { ResultType, Request, multiRouteHandler} from '../../../src/apiHelpers'
import { PrismaClient} from '@prisma/client'
import {getToken} from '../../../src/token'
import { getUsername, createGroup, createCategory, createTopic, updateTopic, addMember, getGroupId, getTaggedPost, updateCategory} from '../../../src/discourse'
import Stripe from 'stripe'
import { sendInviteToCourseEmail, sendCohortEnrollmentEmail } from '../../../emails'

import TemplateCourseDescription from '../../../writing/TemplateCourseDescription.txt'
import TemplateCohortNotes from '../../../writing/TemplateCohortNotes.txt'
import TemplateCohortGettingStarted from '../../../writing/TemplateCohortGettingStarted.txt'

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {apiVersion:'2020-03-02'});
let prisma = new PrismaClient()

export type CreateCohortMsg = {
  courseId: string,
  start: string,
  facilitator: string,
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

export type UpdateCohortMsg = {
  cohortId: string,
  data: Partial<{
    live: boolean
  }>
}

export type UpdateCohortResponse = ResultType<typeof updateCohort>

export type CompleteCohortMsg = {
  cohortId: string
}
export type CompleteCohortResponse = ResultType<typeof completeCohort>

export type InviteToCourseMsg = {course: string}
  & ({ email: string, username: undefined} | {username: string, email: undefined})
export type InviteToCourseResponse = ResultType<typeof inviteToCourse>

export type MarkCourseLiveMsg = {id: string}
export type MarkCourseLiveResponse = ResultType<typeof markCourseLive>

export default multiRouteHandler('action', {
  createCohort,
  enroll,
  createCourse,
  updateCourse,
  completeCohort,
  markCourseLive,
  inviteToCourse,
  updateCohort
})

async function updateCohort(req:Request) {
  let msg = req.body as Partial<UpdateCohortMsg>
  if(!msg.cohortId) return {status: 400, result: "Error: invalid request, missing cohortId parameter"} as const
  if(!msg.data) return {status: 400, result: "Error: invalid request, missing data"} as const
  let newData = await prisma.course_cohorts.update({
    where: {id: msg.cohortId},
    data: {
      live: msg.data.live
    }
  })
  if(!newData) return {status: 404, result: `No cohort with id ${msg.cohortId} found`} as const
  return {status: 200, result: newData} as const
}

async function completeCohort(req:Request) {
  let msg = req.body as Partial<CompleteCohortMsg>
  if(!msg.cohortId) return {status: 400, result: "Error: invalid request, missing parameters"} as const
  let user = getToken(req)
  if(!user) return {status: 400, result: "ERROR: no user logged in'"} as const
  let cohort = await prisma.course_cohorts.findOne({where:{id:msg.cohortId}, select: {facilitator: true}})
  if(!cohort) return {status: 404, result: `No cohort with id ${msg.cohortId} found`} as const

  if(cohort.facilitator !== user.id) return {status: 401, result: "ERROR: user is not a facilitator of this course"} as const

  let completed = (new Date()).toISOString()
  await prisma.course_cohorts.update({
    where: {id:msg.cohortId},
    data: {
      completed
    }
  })
  return {status:200, result: {completed}} as const
}

async function createCohort(req: Request) {
  let msg = req.body as Partial<CreateCohortMsg>
  if(!msg.courseId || !msg.start ||
     !msg.facilitator) return {status: 400, result: "Error: invalid request, missing parameters"} as const

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
      name: true,
      status: true,
      course_cohorts: {
        select: {id: true}
      }
    },
  })
  if(!course) return {status: 400, result: "ERROR: no course found with that id"} as const

  let id = course.id + '-' + course.course_cohorts.length
  let admin = await getUsername(msg.facilitator)
  if(!admin) return {status: 404, result: "ERROR: no user found with id: " + msg.facilitator} as const
  await createGroup({name: id, visibility_level:2, owner_usernames: admin})

  // If the course is in draft status it's category will be private so we need
  // to explicitly add the cohort group
  if(course.status === 'draft') {
    await updateCategory(course.category_id, {name: course.name, permissions: {
      // Make sure to keep any existing cohorts as well
      ...course.course_cohorts.reduce((acc, cohort) => {
        acc[cohort.id] = 1
        return acc
      }, {} as {[i:string]:number}),
      [id]: 1,
      [course.id + '-m']: 1
    }})
    console.log('updated category')
  }
  let category = await createCategory(id, {permissions: {[id]:1}, parent_category_id: course.category_id})
  if(!category) return {status: 500, result: "ERROR: Could not create cohort category"} as const
  await updateTopic(category.topic_url, {
    category_id: category.id,
    title: id + " Notes",
    raw: TemplateCohortNotes,
    tags: ['note']
  }, admin)

  await createTopic({
    category: category.id,
    title: id + " Getting Started",
    raw: TemplateCohortGettingStarted,
    tags: ['getting-started']
  }, admin)

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
            id: msg.facilitator
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
    let gettingStarted = await getTaggedPost(`${cohort.course}/${cohort.id}`, 'getting-started')

    await sendCohortEnrollmentEmail(user.email, {
      name: user.display_name || user.username,
      course_start_date: cohort.start_date,
      course_name: cohort.courses.name,
      cohort_page_url: `https://hyperlink.academy/courses/${cohort.course}/${cohort.id}`,
      cohort_forum_url: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.course}/${cohort.id}`,
      get_started_topic_url: `https://forum.hyperlink.academy/t/${gettingStarted.id}`
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

  let maintainers = await prisma.people.findMany({
    where: {email: {in: msg.maintainers}},
    select: {username: true, id: true}
  })

  let groupName = msg.courseId+'-m'
  if(!(await createGroup({name: groupName, visibility_level: 2, owner_usernames: maintainers.map(m=>m.username)}))) {
    return {status: 500, result: "ERROR: couldn't create course maintainers group"} as const
  }

  let category = await createCategory(msg.name, {slug: msg.courseId, permissions: {[groupName]:1}})
  if(!category) return {status: 500, result: "ERROR: couldn't create course category"} as const
  await updateTopic(category.topic_url, {
    category_id: category.id,
    title: `${msg.name} Curriculum`,
    tags: ['curriculum'],
    raw: TemplateCourseDescription
  }, await getUsername(maintainers[0].id))

  await prisma.courses.create({
    data: {
      category_id: category.id,
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

async function markCourseLive(req: Request) {
  let msg = req.body as Partial<MarkCourseLiveMsg>
  if(!msg.id) return {status: 400, result: "ERROR: invalid request, missing id paramter"} as const
  let user = getToken(req)
  if(!user) return {status: 401, result: "ERROR: no user logged in"} as const
  let course = await prisma.courses.findOne({
    where:{id: msg.id},
    select: {course_maintainers: {select: {maintainer: true}}, status: true, category_id: true, name: true}
  })

  if(!course) return {status:404, result: `ERROR: no course with id ${msg.id} found`} as const
  if(course.status !== 'draft') return {status: 400, result: "ERROR: course is not in draft status"} as const
  if(!course.course_maintainers.find(m => m.maintainer === user?.id)) return {status: 401, result: "ERROR: user is not a maintainer of this course"} as const

  if(!await updateCategory(course.category_id, {permissions: {everyone: 1}, name: course.name})) return {status:500, result: "ERROR: unable to update course category"} as const
  await prisma.courses.update({where: {id: msg.id}, data:{status: 'live'}})
  return {status: 200, result: "Set course status to live"} as const
}
