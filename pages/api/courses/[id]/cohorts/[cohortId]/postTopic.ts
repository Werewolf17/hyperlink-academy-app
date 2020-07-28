
import { PrismaClient } from "@prisma/client"
import { ResultType, APIHandler, Request } from "src/apiHelpers"
import { getToken } from "src/token";
import { createTopic, getCategory } from "src/discourse";

let prisma = new PrismaClient()
export type PostTopicMsg = {
  title: string,
  body: string,
  tags: string[]
}
export type PostTopicResponse = ResultType<typeof postTopic>

export default APIHandler(postTopic)

async function postTopic(req:Request) {
  let msg = req.body as Partial<PostTopicMsg>
  let courseId = req.query.id
  let cohortNum = req.query.cohortId
  if(!msg.title || !msg.body || !msg.tags) return {status:400, result: "ERROR: missing field title, body, or tags"} as const
  let user = getToken(req)
  if(!user) return {status: 400, result: "ERROR: no user logged in"} as const

  let cohort = await prisma.course_cohorts.findOne({
    where: {id: `${courseId}-${cohortNum}`},
    select:{
      facilitator: true,
      id: true,
      courses: {select: {id: true, slug: true}}}
  })
  if(!cohort) return {status:404, result: `ERROR: Cannot find cohort ${cohortNum} in course ${courseId}`} as const

  if(cohort.facilitator !== user.id) return {status:401, result:`ERROR: User is not facilitator of cohort`} as const
  let category = await getCategory(cohort.courses.slug + '/' + cohort.id)

  let topic = await createTopic({
    title: msg.title,
    raw: msg.body,
    category: category.topic_list.topics[0].category_id,
    tags: msg.tags
  }, user.username)
  if(!topic)  return {status:500, result: "ERROR: Unable to create topic"} as const
  console.log(topic)
  return {status:200, result: {topic}} as const
}
