import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../../src/hmac'
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs'
import sendResetEmail from '../../../emails/resetPassword'

const prisma = new PrismaClient()

export type RequestMsg = {
  email: string
}

export type ResetMsg = {
  key: string
  password: string
}

export type Response = {
  success: boolean
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
      created_time: new Date(Date.now()).toISOString(),
      key_hash: hmac(key)
  }})
  return key
}

const checkUser = async (email:string):Promise<boolean> => {
  return (await prisma.people.findMany({where: {email}})).length > 0
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  switch(req.query.action) {
      case 'request': {
        requestResetPassword(req, res)
      }
      case 'reset': {
        resetPassword(req, res)
      }
  }
}

const requestResetPassword = async (req:NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<RequestMsg> = JSON.parse(req.body)
  if(!msg.email) {
    return res.status(403).end()
  }

  if(!(await checkUser(msg.email))) {
    res.json({success:true})
  }

  else {
    let key = await createResetKey(msg.email)

    let url = `${req.headers.origin}/resetPassword?&key=${key}`

    await sendResetEmail(msg.email, url)
    res.json({success: true})
  }

  await prisma.disconnect()
  res.end()
}

async function getResetKey(hash: string) {
  return prisma.password_reset_keys.findOne({where:{key_hash:hash}})
}

const resetPassword = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  let msg: Partial<ResetMsg> = JSON.parse(req.body)
  if(!msg.key || !msg.password) {
    res.json({success: false})
    return res.end()
  }

  let hash = hmac(msg.key)
  let resetKey = await getResetKey(hash)
  if(!resetKey) {
    await prisma.disconnect()
    return res.json({success:false})
  }

  let date = new Date(resetKey.created_time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    return res.json({success:false})
  }

  try {
    await updatePassword(resetKey.email, msg.password, hash)
    await prisma.disconnect()
    return res.json({success:true})
  }
  catch (e){
    await prisma.disconnect()
    console.log(e)
    return res.json({success:false})
  }
}

export async function updatePassword(email: string, newPassword: string, key_hash: string) {
  let password_hash = await bcrypt.hash(newPassword, await bcrypt.genSalt())

  await prisma.password_reset_keys.delete({where:{key_hash}})
  return prisma.people.update({where:{email}, data:{password_hash}})
}
