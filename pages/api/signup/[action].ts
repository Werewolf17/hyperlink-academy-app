import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';

import hmac from '../../../src/hmac'
import {setTokenHeader} from '../../../src/token'
import {multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import {syncSSO} from '../../../src/discourse'
import sendVerificationEmail from '../../../emails/verifyEmail'

const prisma = new PrismaClient()

export type SignupMsg = {
  email: string
  username: string
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
  if(!msg.email || !msg.password || !msg.username) {
    return {status: 400, result: 'Error: invalid message, missing email, password, or display_name'} as const
  }
  if(msg.username.length < 3 || msg.username.length > 20) return {status: 400, result: "Error: username must be between 3 and 20 characters"}
  if(/\s/.test(msg.username)) return {status:400, result: "Error: username cannot contain spaces"} as const

  if(!(await checkUser(msg.email))) {
    await prisma.disconnect()
    return {status:401, result: "Error: A user exists with that email"} as const
  }

  let salt = await bcrypt.genSalt()
  let password_hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey({email: msg.email, username:msg.username, password_hash})
  await prisma.disconnect()

  let activation_url = `${req.headers.origin}/signup?verifyEmail=${key}`

  await sendVerificationEmail(msg.email, {activation_code: key, name:msg.username, activation_url})
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

  let id = await createUser({
    username: token.username,
    email: token.email,
    password_hash: token.password_hash
  })

  await prisma.disconnect()
  if(!id) return {status: 403, result: "Error: Couldn't create user. May already exist"}

  await syncSSO({
    external_id: id,
    username: token.username,
    email: token.email
  })

  return {
    status: 200,
    result: '',
    headers: setTokenHeader({id, email:token.email,username:token.username})
  } as const
}

const createActivationKey = async (person:{email: string, password_hash: string, username: string}) => {
  let key = uuidv4()
  await prisma.activation_keys.create({
    data: {
      ...person,
      created_time: new Date(Date.now()).toISOString(),
      key_hash: hmac(key)
    }
  })
  return key
}

const checkUser = async (email:string):Promise<boolean> => {
  return !(await prisma.people.findOne({where: {email}}))
}


const createUser = async (input:{email:string, password_hash:string, username: string}) => {
  let data = {
    ...input,
    id: uuidv4()
  }
  try {
    await prisma.people.create({data})
    await prisma.activation_keys.deleteMany({where:{email:input.email}})
  } catch(e) {
    console.log(e)
    return false
  }
  return data.id
}

const getActivationKey = async (hash: string)=> {
  return prisma.activation_keys.findOne({
    where: {key_hash: hash},
    select: {username: true, email: true, password_hash: true, created_time: true}
  })
}
