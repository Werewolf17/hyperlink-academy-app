import { NextApiRequest, NextApiResponse} from 'next'
import { PrismaClient, coursesGetPayload} from '@prisma/client'

type CourseWithInstances = coursesGetPayload<{include: {course_instances: {select:{start_date: true}}}}>

export type Result = {
  courses: CourseWithInstances[]
}

let prisma = new PrismaClient()

export default async (_req: NextApiRequest, res: NextApiResponse<Result>) => {
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
  await prisma.disconnect()

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  return res.json({courses})
}
