import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';

import hmac from '../../../src/hmac'
import {setTokenHeader} from '../../../src/token'
import {multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
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

export type VerifyEmailMsg = {
  key: string
}

export type SignupResponse = ResultType<typeof Signup>
export type VerifyEmailResponse = ResultType<typeof VerifyEmail>

export default multiRouteHandler('action', {
  request: Signup,
  verify: VerifyEmail
})

async function Signup(req: Request) {
  let msg: Partial<SignupMsg> = req.body
  if(!msg.email || !msg.password || !msg.display_name) {
    return {status: 400, result: 'Error: invalid message, missing email, password, or display_name'} as const
  }

  if(!(await checkUser(msg.email))) {
    await prisma.disconnect()
    return {status:401, result: "Error: A user exists with that email"} as const
  }

  let salt = await bcrypt.genSalt()
  let hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey(msg.email, hash, msg.display_name)
  await prisma.disconnect()

  let activation_url = `${req.headers.origin}/signup?verifyEmail=${key}`

  await sendVerificationEmail(msg.email, {activation_code: key, name:msg.display_name, activation_url})
  return {status: 200, result: ''} as const
}

async function VerifyEmail (req: Request) {
  let msg: Partial<VerifyEmailMsg> = req.body
  if(!msg.key) return {status: 400, result: 'Error: invalid message, missing property key'} as const

  let keyHash = hmac(msg.key)
  let token = await getActivationKey(keyHash)
  if(!token) return {status: 403, result: 'Error: invalid activation_key'}

  let date = new Date(token.created_time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    await prisma.disconnect()
    return {status: 403, result: "Error: activation_key is out of date"}
  }

  let id = await createUser(token.email, token.password_hash, token.display_name)
  await prisma.disconnect()
  if(!id) return {status: 403, result: "Error: Couldn't create user. May already exist"}

  await syncSSO({
    external_id: id,
    email: token.email
  })

  return {
    status: 200,
    result: '',
    headers: setTokenHeader({email:token.email, id, display_name:token.display_name})
  } as const
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
