import { NextApiRequest, NextApiResponse} from 'next'
import {getToken} from '../../src/token'
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

export type Msg = {
  display_name?: string,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)

  let user = getToken(req)
  if(!user) {
    return res.status(402).end()
  }

  if(msg.display_name) {
    await updatePerson(user.id, msg.display_name)
  }

  await prisma.disconnect()
  res.end()
}

async function updatePerson(id:string, display_name:string) {
  return await prisma.people.update({where:{id}, data:{display_name}})
}
