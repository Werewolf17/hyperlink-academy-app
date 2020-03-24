import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import {ActivationKey} from './signup'
import hmac from '../../src/hmac'
import { v4 as uuidv4 } from 'uuid';
import fetch from 'isomorphic-unfetch'

export type Msg = {
  key: string
}

export type Result = {
 success: true
} | {
  success: false
  error: 'invalid message'
} | {
  success: false
  error: 'invalid key'
} | {
  success: false
  error: 'old key'
}

export type User = {
  email: string,
  id: string
  hash: string
}

const createUser = (email:string, hash:string, keyHash: string) => {
  let data:User = {
    email, hash, id: uuidv4()
  }
  return client.query(q.Do([
    q.Delete(q.Select('ref', q.Get(q.Match(q.Index('activationKeyByHash'), keyHash)))),
    q.Create(q.Collection('People'), {
      data,
    })]))
}

const getActivationKey = async (hash: string)=> {
  let txResult = await client.query(q.Get(q.Match(q.Index('activationKeyByHash'), hash))) as {data: ActivationKey}
  return txResult.data
}

export default async (req: NextApiRequest, res: NextApiResponse<Result>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.key) return res.json({success:false, error: 'invalid message'})

  let keyHash = hmac(msg.key)
  let token = await getActivationKey(keyHash)
  if(!token) return res.json({success: false, error: 'invalid key'})

  let date = new Date(token.time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    return res.json({success:false, error:'old key'})
  }

  await createUser(token.email, token.userHash, keyHash)
  return res.json({success:true})
}

export const callVerifyEmail =  async (msg:Msg):Promise<Result> => {
  let res = await fetch('/api/verifyEmail', {
    method: "POST",
    body: JSON.stringify(msg)
  })

  return await res.json()
}
