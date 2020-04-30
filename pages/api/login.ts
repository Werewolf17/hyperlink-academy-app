import {APIHandler, ResultType, Request} from '../../src/apiHelpers'
import {setTokenHeader} from '../../src/token'
import bcrypt from 'bcryptjs'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  forceTransactions: true
})

export type Msg = {
  email: string
  password: string
}

export type Result = ResultType<typeof handler>

const handler = async (req: Request) => {
  let msg = req.body as Partial<Msg>
  if(!msg.email || !msg.password) {
    return {
      status: 400 as const,
      result: "Invalid request, email or password missing" as const
    }
  }

  let person = await validateLogin(msg.email, msg.password)
  if(person) {
    let token = {email:msg.email, id:person.id, display_name:person.display_name, admin: person.admins.length > 0}
    return {
      status: 200 as const,
      headers: setTokenHeader(token),
      result: token
    }
  }
  else {
    return {
      status: 401 as const,
      result: 'Wrong username or password' as const
    }
  }
}

export default APIHandler(handler)

async function validateLogin(email: string, password: string){
  try {
    let person = await prisma.people.findOne({where:{email}, include: {admins: true}})
    await prisma.disconnect()
    if(!person) return false
    if(!await bcrypt.compare(password, person.password_hash)) return false
    return person
  } catch (e) {
    console.log(e)
    return false
  }
}
