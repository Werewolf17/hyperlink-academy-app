import { NextApiRequest, NextApiResponse} from 'next'
import {getToken} from '../../../src/token'
import { PrismaClient, course_instances } from '@prisma/client'
let prisma = new PrismaClient()

export type Result = {
  course_instances: course_instances[]
}

export default async (req: NextApiRequest, res: NextApiResponse<Result>) => {
  let token = getToken(req)
  if(token) {
    let course_instances = await prisma.course_instances.findMany({where:{
      people_in_instances: {some: {person_id: token.id}}
    }})
    await prisma.disconnect()
    return res.json({course_instances})
  }
  return res.json({course_instances:[]})
}
