import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../src/hmac'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';
import fetch from 'isomorphic-unfetch'
import sendVerificationEmail from '../../emails/verifyEmail'

const prisma = new PrismaClient()

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

const createActivationKey = async (email: string, hash: string) => {
  let key = uuidv4()
  await prisma.activation_keys.create({
    data: {
      password_hash: hash,
      email,
      time: new Date(Date.now()).toISOString(),
      key_hash: hmac(key)
    }
  })
  return key
}

const checkUser = async (email:string):Promise<boolean> => {
  return !(await prisma.people.findOne({where: {email}}))
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {

  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email || !msg.password) {
    res.json({success: false, error: 'invalid message'})
    return res.end()
  }

  if(!(await checkUser(msg.email))) {
    res.json({success: false, error: 'user exists'})
    res.end()
    await prisma.disconnect()
    return
  }

  let salt = await bcrypt.genSalt()
  let hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey(msg.email, hash)
  await prisma.disconnect()

  let url = `${req.headers.origin}/verifyEmail?&key=${key}`

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
