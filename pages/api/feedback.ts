import {APIHandler, ResultType, Request} from '../../src/apiHelpers'
import {createPost} from '../../src/discourse'
export type FeedbackResult = ResultType<typeof handler>
export type FeedbackMsg = {
  feedback: string,
  page: string
  username?: string
}

export default APIHandler(handler)

async function handler(req:Request) {
  let msg = req.body as Partial<FeedbackMsg>
  if(!msg.page || !msg.page) return {status:400, result: "ERROR: fields missing, expected feedback and string"} as const
  await createPost({topic_id: 231, raw: `
${msg.username ? "username: @"+msg.username : ""}
page: ${req.headers.referer}

${msg.feedback}
`})
  return {status:200, result: ""} as const
}
