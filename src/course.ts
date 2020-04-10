import { PrismaClient, coursesGetPayload } from '@prisma/client'
import { GetServerSideProps } from 'next'

export type CourseData = coursesGetPayload<{include: {course_instances: true}}>
export const getCourseData = (id:string) => {
  const getServerSideProps:GetServerSideProps= async () => {
    let prisma = new PrismaClient()
    let data = await prisma.courses.findOne({
      where: {id},
      include: {course_instances: true}
    })
    await prisma.disconnect()
    return {props: data as CourseData}
  }
  return getServerSideProps
}
