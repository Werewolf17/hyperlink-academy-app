import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';

import hmac from '../../../src/hmac'
import {setToken} from '../../../src/token'
import {syncSSO} from '../../../src/discourse'
import sendVerificationEmail from '../../../emails/verifyEmail'

const prisma = new PrismaClient({
  forceTransactions: true
})

export type SignupMsg = {
  email: string
  display_name: string
  password: string
}

type SignupResponse = {
  success: true
} | {
  success: false,
  error: 'user exists'
} | {
  success: false,
  error: 'invalid message'
}

export type VerifyEmailMsg = {
  key: string
}

export type VerifyEmailResult = {
 success: true
} | {
  success: false
  error: 'invalid message' | 'invalid key' | 'old key' | 'user exists'
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch(req.query.action) {
      case 'request': return Signup(req, res)
      case 'verify': return VerifyEmail(req, res)
  }
}

const Signup = async (req: NextApiRequest, res: NextApiResponse<SignupResponse>) => {
  let msg: Partial<SignupMsg> = JSON.parse(req.body)
  if(!msg.email || !msg.password || !msg.display_name) {
    res.json({success: false, error: 'invalid message'})
    return res.status(403).end()
  }

  if(!(await checkUser(msg.email))) {
    res.json({success: false, error: 'user exists'})
    res.end()
    await prisma.disconnect()
    return
  }

  let salt = await bcrypt.genSalt()
  let hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey(msg.email, hash, msg.display_name)
  await prisma.disconnect()

  let activation_url = `${req.headers.origin}/signup?verifyEmail=${key}`

  await sendVerificationEmail(msg.email, {activation_code: key, name:msg.display_name, activation_url})
  res.json({success: true})
  return res.end()
}

const VerifyEmail = async (req: NextApiRequest, res: NextApiResponse<VerifyEmailResult>) => {
  let msg: Partial<VerifyEmailMsg> = JSON.parse(req.body)
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

const createActivationKey = async (email: string, hash: string, display_name: string) => {
  let key = uuidv4()
  await prisma.activation_keys.create({
    data: {
      password_hash: hash,
      email,
      display_name,
      created_time: new Date(Date.now()).toISOString(),
      key_hash: hmac(key)
    }
  })
  return key
}

const checkUser = async (email:string):Promise<boolean> => {
  return !(await prisma.people.findOne({where: {email}}))
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
