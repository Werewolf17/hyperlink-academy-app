import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import {ActivationKey} from './signup'
import bcrypt from 'bcryptjs'
import fetch from 'isomorphic-unfetch'

export type Msg = {
  key: string
  id: string
}

export type Result = {
 success: true
} | {
  success: false
  error: 'invalid message'
} | {
  success: false
  error: 'invalid key'
}

const createUser = (email:string, hash:string, id: string) => {
  return client.query(q.Do([
    q.Delete(q.Select('ref', q.Get(q.Match(q.Index('activationKeyByID'), id)))),
    q.Create(q.Collection('People'), {
      data: {
        email,
        hash,
      },
    })]))
}

const getActivationKey = async (id: string)=> {
  let txResult = await client.query(q.Get(q.Match(q.Index('activationKeyByID'), id))) as {data: ActivationKey}
  return txResult.data
}

export default async (req: NextApiRequest, res: NextApiResponse<Result>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.key || !msg.id) return res.json({success:false, error: 'invalid message'})

  let key = await getActivationKey(msg.id)
  let salt = bcrypt.getSalt(key.hash)
  let hash = await bcrypt.hash(msg.key, salt)
  if(hash === key.hash) {
    await createUser(key.email, key.userHash, msg.id)
    return res.json({success:true})
  }
  else {
    return res.json({success: false, error: 'invalid key'})
  }
}

export const callVerifyEmail =  async (msg:Msg):Promise<Result> => {
  let res = await fetch('/api/verifyEmail', {
    method: "POST",
    body: JSON.stringify(msg)
  })

  return await res.json()
}
