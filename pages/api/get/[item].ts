import { NextApiRequest, NextApiResponse} from 'next'
import { PrismaClient, coursesGetPayload, course_instances} from '@prisma/client'
import {getToken, Token} from '../../../src/token'

type CourseWithInstances = coursesGetPayload<{include: {course_instances: {select:{start_date: true}}}}>

export type CourseResult = {
  courses: CourseWithInstances[]
}
export type InstanceResult = {
  course_instances: course_instances[]
}
export type WhoAmIResult = Token | false

export type Result = CourseResult |
  InstanceResult |
  WhoAmIResult |
  string

let prisma = new PrismaClient()

export default async (req: NextApiRequest, res: NextApiResponse<Result>) => {
  switch(req.query.item) {
    case 'courses': {
      let courses = await prisma.courses.findMany({
        include: {
          course_instances: {
            select: {
              start_date: true
            },
            orderBy: {
              start_date: "asc"
            },
            first: 1
          }
        }
      })
      return res.json({courses})
    }

    case 'user_instances': {
      let token = getToken(req)
      if(!token) return res.status(403).send('Error: no user logged in')
      let course_instances = await prisma.course_instances.findMany({where:{
        people_in_instances: {some: {person_id: token.id}}
      }})
      await prisma.disconnect()
      return res.json({course_instances})
    }
      case 'whoami': {
        return res.json(getToken(req) || false)
      }
    default: return res.status(403).send('Error: invalid msg')
  }
}
