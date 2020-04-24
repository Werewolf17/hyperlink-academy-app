import {multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import {PrismaClient} from '@prisma/client'
import hmac from '../../../src/hmac'
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs'
import sendResetEmail from '../../../emails/resetPassword'

const prisma = new PrismaClient({
  forceTransactions: true
})

export type RequestMsg = {
  email: string
}

export type ResetMsg = {
  key: string
  password: string
}

export type RequestResult = ResultType<typeof requestResetPassword>
export type ResetResult = ResultType<typeof resetPassword>

export default multiRouteHandler('action', {
  request: requestResetPassword,
  reset: resetPassword
})

async function requestResetPassword (req:Request) {
  let msg = req.body as Partial<RequestMsg>
  if(!msg.email) {
    return {status: 403, result: "Error: invalid request, missing email"} as const
  }

  if(!(await checkUser(msg.email))) {
    return {status: 200, result: ""} as const
  }

  else {
    let key = await createResetKey(msg.email)
    await prisma.disconnect()

    let url = `${req.headers.origin}/resetPassword?&key=${key}`

    await sendResetEmail(msg.email, url)
    return {status: 200, result: ""} as const
  }
}

async function resetPassword (req:Request) {
  let msg = req.body as Partial<ResetMsg>
  if(!msg.key || !msg.password) {
    return {
      status: 400,
      result: "Error: invalid message, missing key or new password"
    } as const
  }

  let hash = hmac(msg.key)
  let resetKey = await getResetKey(hash)
  if(!resetKey) {
    await prisma.disconnect()
    return {
      status: 403,
      result: "Error: invalid reset key"
    } as const
  }

  let date = new Date(resetKey.created_time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    return {
      status: 403,
      result: "Error: password reset key out of date"
    } as const
  }

  await updatePassword(resetKey.email, msg.password, hash)
  await prisma.disconnect()
  return {status: 200, result:''}
}

async function getResetKey(hash: string) {
  return prisma.password_reset_keys.findOne({where:{key_hash:hash}})
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


export async function updatePassword(email: string, newPassword: string, key_hash: string) {
  let password_hash = await bcrypt.hash(newPassword, await bcrypt.genSalt())

  await prisma.password_reset_keys.delete({where:{key_hash}})
  return prisma.people.update({where:{email}, data:{password_hash}})
}
