import { PrismaClient, coursesGetPayload } from '@prisma/client'
import {getToken} from './token'
import { GetServerSideProps } from 'next'

export type CourseData = coursesGetPayload<{include: {course_instances: {include: {people_in_instances: true}}}}>
export const getCourseData = (id:string) => {
  const getServerSideProps:GetServerSideProps = async ({req}) => {
    let prisma = new PrismaClient()
    let user = getToken(req)
    let data = await prisma.courses.findOne({
      where: {id},
      include: {
        course_instances: {
          include: {
            people_in_instances: {
              where: {person_id: user?.id || 'null'}
            }
          },
          orderBy: {
            start_date: 'desc'
          },
          first: 1,
        }

      }
    })
    await prisma.disconnect()
    return {props: data as CourseData}
  }
  return getServerSideProps
}
