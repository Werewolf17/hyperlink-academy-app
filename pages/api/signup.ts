import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import bcrypt from 'bcryptjs'
import fetch from 'isomorphic-unfetch'

const createUser = (email:string, hash:string) => {
  return client.query(q.Create(q.Collection('People'), {
    data: {
      email,
      hash,
    },
  }))
}

const checkUser = (email:string):Promise<boolean> => {
  return client.query(q.IsEmpty(q.Match(q.Index('personByEmail'), email)))
}

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

  await createUser(msg.email, hash)
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
