import { NextApiRequest, NextApiResponse} from 'next'
import {setToken} from '../../src/token'
import bcrypt from 'bcryptjs'

import {PrismaClient} from '@prisma/client'
const prisma = new PrismaClient()

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
  let id = await validateLogin(msg.email, msg.password)
  if(id) {
    setToken(res, {email:msg.email, id})
    res.end()
  }
  else {
    res.status(401)
    return res.end()
  }
}

async function validateLogin(email: string, password: string):Promise<false | string> {
  try {
    let person = await prisma.people.findOne({where:{email}})
    await prisma.disconnect()
    if(!person) return false
    if(!await bcrypt.compare(password, person.password_hash)) return false
    return person.id
  } catch (e) {
    return false
  }
}
