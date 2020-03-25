import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import hmac from '../../src/hmac'
import { v4 as uuidv4 } from 'uuid';
import sendResetEmail from '../../emails/resetPassword'

export type Msg = {
  email: string
}

type Response = {
  success: true
} | {
  success: false,
}

export type ResetKey = {
  email: string
  time: string,
  hash: string
}

const createResetKey = async (email: string) => {
  let key = uuidv4()
  let data:ResetKey= {
      email,
      time: new Date(Date.now()).toISOString(),
      hash: hmac(key)
    }
  await client.query(q.Create(q.Collection('ResetKeys'), {
    data
  }))
  return key
}

const checkUser = (email:string):Promise<boolean> => {
  return client.query(q.Not(q.IsEmpty(q.Match(q.Index('personByEmail'), email))))
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email) {
    res.json({success: false})
    return res.end()
  }
  if(!(await checkUser(msg.email))) {
    res.json({success:true})
    return res.end()
  }

  let key = await createResetKey(msg.email)

  let url = `${req.headers.origin}/resetPassword?&key=${key}`

  await sendResetEmail(msg.email, url)

  res.json({success: true})
  return res.end()
}
