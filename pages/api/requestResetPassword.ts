import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../src/hmac'
import { v4 as uuidv4 } from 'uuid';
import sendResetEmail from '../../emails/resetPassword'

const prisma = new PrismaClient()

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
  await prisma.password_reset_keys.create({data:{
      email,
      time: new Date(Date.now()).toISOString(),
      key_hash: hmac(key)
  }})
  return key
}

const checkUser = async (email:string):Promise<boolean> => {
  return (await prisma.people.findMany({where: {email}})).length > 0
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
