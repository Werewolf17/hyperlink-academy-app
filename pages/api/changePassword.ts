import { NextApiRequest, NextApiResponse} from 'next'
import {getToken} from '../../src/token'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export type Msg = {
  oldPassword: string
  newPassword: string
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.oldPassword || !msg.newPassword) {
    return res.status(402).end()
  }
  let user = getToken(req)
  if(!user) {
    return res.status(402).end()
  }

  if(await validateLogin(user.email, msg.oldPassword)) {
    await updatePassword(user.email, msg.newPassword)
  }
  else {
    res.status(401)
  }
  await prisma.disconnect()
  res.end()
}

async function validateLogin(email: string, password: string):Promise<boolean> {
  try {
    let person = await prisma.people.findOne({where:{email}})
    if(!person) return false
    return await bcrypt.compare(password, person.password_hash)
  } catch (e) {
    return false
  }
}

async function updatePassword(email: string, newPassword: string) {
  let password_hash= await bcrypt.hash(newPassword, await bcrypt.genSalt())
  await prisma.people.update({where:{email}, data:{password_hash}})
}
