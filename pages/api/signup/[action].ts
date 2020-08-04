import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';

import hmac from '../../../src/hmac'
import {setTokenHeader} from '../../../src/token'
import {multiRouteHandler, ResultType, Request} from '../../../src/apiHelpers'
import {syncSSO} from '../../../src/discourse'
import {sendVerificationEmail} from '../../../emails'

const prisma = new PrismaClient()

export type SignupMsg = {
  email: string
  username: string
  password: string
  newsletter: boolean
}

export type VerifyEmailMsg = {
  key: string
}

export type NewsletterSignupMsg = {email: string}

export type SignupResponse = ResultType<typeof Signup>
export type VerifyEmailResponse = ResultType<typeof VerifyEmail>
export type NewsletterSignupResponse = ResultType<typeof newsletterSignup>

export default multiRouteHandler('action', {
  request: Signup,
  verify: VerifyEmail,
  newsletter: newsletterSignup
})

async function Signup(req: Request) {
  let msg: Partial<SignupMsg> = req.body
  if(!msg.email || !msg.password || !msg.username || msg.newsletter === undefined) {
    return {status: 400, result: 'Error: invalid message, missing email, password, newsletter, or display_name'} as const
  }
  if(msg.username.length < 3 || msg.username.length > 20) return {status: 400, result: "Error: username must be between 3 and 20 characters"}
  if(/\s/.test(msg.username)) return {status:400, result: "Error: username cannot contain spaces"} as const

  if(!(await checkUser(msg.email))) {
    await prisma.disconnect()
    return {status:401, result: "Error: A user exists with that email"} as const
  }

  let salt = await bcrypt.genSalt()
  let password_hash = await bcrypt.hash(msg.password, salt)

  let key = await createActivationKey({email: msg.email.toLowerCase(), username:msg.username, password_hash, newsletter:msg.newsletter})
  await prisma.disconnect()

  let origin = (new URL(req.headers.referer || '')).origin
  let activation_url = `${origin}/signup?verifyEmail=${key}`

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

  if(token.newsletter) {
    fetch('https://api.buttondown.email/v1/subscribers',{
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
        "Content-Type": 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        email: token.email
      })
    })
  }

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

const createActivationKey = async (person:{email: string, password_hash: string, username: string, newsletter:boolean}) => {
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
  return !(await prisma.people.findOne({where: {email: email.toLowerCase()}}))
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
    select: {username: true, email: true, password_hash: true, created_time: true, newsletter: true}
  })
}

async function newsletterSignup (req: Request) {
  let msg = req.body as Partial<NewsletterSignupMsg>
  if(!msg.email) return {status: 400, result: "ERROR: no email provided"} as const

  await fetch('https://api.buttondown.email/v1/subscribers',{
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      "Content-Type": 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      email: msg.email,
      tags: [
        'homepage'
      ]
    })
  })
  return {status:200, result: 'Signed up for newsletter'}
}
