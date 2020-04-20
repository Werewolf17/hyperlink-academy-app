import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../src/hmac'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';
import sendVerificationEmail from '../../emails/verifyEmail'

const prisma = new PrismaClient()

export type Msg = {
  email: string
  display_name: string
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

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {

  let msg: Partial<Msg> = JSON.parse(req.body)
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
