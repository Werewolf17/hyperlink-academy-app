import { NextApiRequest, NextApiResponse} from 'next'
import {setToken, getToken} from '../../src/token'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export type Msg = {
  display_name?: string,
  password?: {
    new: string,
    old: string
  },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)

  let user = getToken(req)
  if(!user) {
    return res.status(402).end()
  }

  if(msg.password) {
    if(await validateLogin(user.email, msg.password.old)) {
      await updatePassword(user.email, msg.password.new)
    }
    else {
      res.status(401).send("ERROR: Incorrect password")
    }
  }

  if(msg.display_name) {
    let newData = await updatePerson(user.id, msg.display_name)
    setToken(res, {...user, display_name:newData.display_name})
  }


  await prisma.disconnect()
  res.end()
}

async function updatePerson(id:string, display_name:string) {
  return await prisma.people.update({
    where:{id},
    data:{display_name}
  })
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
