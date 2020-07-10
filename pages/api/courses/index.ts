import { PrismaClient} from '@prisma/client'
import { getUsername, createGroup, createCategory, updateTopic } from '../../../src/discourse'
import TemplateCourseDescription from '../../../writing/TemplateCourseDescription.txt'
import {getToken} from '../../../src/token'
import { ResultType, Request, APIHandler} from '../../../src/apiHelpers'

let prisma = new PrismaClient()

export type CourseResult = ResultType<typeof getCourses>
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

export default APIHandler({POST: createCourse, GET: getCourses})

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
