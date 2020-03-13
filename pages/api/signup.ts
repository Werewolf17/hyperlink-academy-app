import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import bcrypt from 'bcryptjs'
import fetch from 'isomorphic-unfetch'
import sendVerificationEmail from '../../emails/verifyEmail'

type Msg = {
  email: string
  password: string
}

type Response = {
  success: true
} | {
  success: false,
  error: 'user exists'
} | {
  success: false,
  error: 'invalid message'
}

export type ActivationKey = {
      userHash: string
      email: string
      id: number
      hash: string
}

const createActivationKey = async (email: string, hash: string) => {
  let salt = await bcrypt.genSalt()
  let key = await bcrypt.genSalt()
  let txResult = await client.query(q.Create(q.Collection('ActivationKeys'), {
    data: {
      userHash: hash,
      email,
      id: q.NewId(),
      hash: await bcrypt.hash(key, salt)
    }
  })) as {
    data: ActivationKey
  }
  return {id: txResult.data.id, key}
}

const checkUser = (email:string):Promise<boolean> => {
  return client.query(q.IsEmpty(q.Match(q.Index('personByEmail'), email)))
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {

  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email || !msg.password) {
    res.json({success: false, error: 'invalid message'})
    return res.end()
  }
  if(!(await checkUser(msg.email))) {
    res.json({success: false, error: 'user exists'})
    return res.end()
  }

  let salt = await bcrypt.genSalt()
  let hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey(msg.email, hash)

  let url = `${req.headers.origin}/verifyEmail?id=${key.id}&key=${key.key}`

  await sendVerificationEmail(msg.email, url)

  res.json({success: true})
  return res.end()
}

export const callSignup = async (msg: Msg): Promise<Response> => {
  let res = await fetch('/api/signup', {
    method: "POST",
    body: JSON.stringify(msg)
  })

  return await res.json()
}
