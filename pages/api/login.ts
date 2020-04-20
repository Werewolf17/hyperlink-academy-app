import { NextApiRequest, NextApiResponse} from 'next'
import {setToken} from '../../src/token'
import bcrypt from 'bcryptjs'

import { PrismaClient, people} from '@prisma/client'
const prisma = new PrismaClient({
  forceTransactions: true
})

export type Msg = {
  email: string
  password: string
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email || !msg.password) {
    res.status(402)
    return res.end()
  }
  let person = await validateLogin(msg.email, msg.password)
  if(person) {
    setToken(res, {email:msg.email, id:person.id, display_name:person.display_name})
    res.end()
  }
  else {
    res.status(401)
    return res.end()
  }
}

async function validateLogin(email: string, password: string):Promise<false | people> {
  try {
    let person = await prisma.people.findOne({where:{email}})
    await prisma.disconnect()
    if(!person) return false
    if(!await bcrypt.compare(password, person.password_hash)) return false
    return person
  } catch (e) {
    return false
  }
}
