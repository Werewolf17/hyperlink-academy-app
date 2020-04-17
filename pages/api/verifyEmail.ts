import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../src/hmac'
import {syncSSO} from '../../src/discourse'
import { v4 as uuidv4 } from 'uuid';
import fetch from 'isomorphic-unfetch'
import {setToken} from '../../src/token'

const prisma = new PrismaClient()

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
}| {
  success: false
  error: 'user exists'
}

const createUser = async (email:string, password_hash:string, display_name: string) => {
  let data = {
    email, password_hash, display_name, id: uuidv4()
  }
  try {
    await prisma.people.create({data})
    await prisma.activation_keys.deleteMany({where:{email}})
  } catch(e) {
    return false
  }
  return data.id
}

const getActivationKey = async (hash: string)=> {
  return prisma.activation_keys.findOne({where: {key_hash: hash}})
}

export default async (req: NextApiRequest, res: NextApiResponse<Result>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.key) return res.json({success:false, error: 'invalid message'})

  let keyHash = hmac(msg.key)
  let token = await getActivationKey(keyHash)
  if(!token) return res.json({success: false, error: 'invalid key'})

  let date = new Date(token.created_time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    await prisma.disconnect()
    return res.json({success:false, error:'old key'})
  }

  let id = await createUser(token.email, token.password_hash, token.display_name)
  await prisma.disconnect()
  if(!id) return res.json({success:false, error:'user exists'})

  await syncSSO({
    external_id: id,
    email: token.email
  })

  setToken(res, {email:token.email, id, display_name:token.display_name})
  return res.json({success:true})
}

export const callVerifyEmail =  async (msg:Msg):Promise<Result> => {
  let res = await fetch('/api/verifyEmail', {
    method: "POST",
    body: JSON.stringify(msg)
  })

  return await res.json()
}
