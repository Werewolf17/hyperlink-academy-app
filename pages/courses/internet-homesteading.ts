import h from 'react-hyperscript'
import { PrismaClient, course_instances } from '@prisma/client'
import {getToken} from '../../src/token'
import Enroll from '../../components/Course/Enroll'
import { GetServerSideProps } from 'next'

type Props = {
  instances: course_instances[]
}
export default (props:Props) => {
  return h('div', [
    h('h1', 'Internet Homesteading'),
    h('p', 'a course of some kind, probably'),
    h(Enroll, {instances:props.instances, cost: 50})
  ])
}

export const getServerSideProps:GetServerSideProps<Props> = async ({req}) => {
  let prisma = new PrismaClient()
  let user = getToken(req)
  let instances = await prisma.course_instances.findMany({
    where: {
      course: 'internet-homesteading'
    },
  })

  if(user) {
    let instancesUserIsIn = await prisma.people_in_instances.findMany({
      where: {
      person_id: user.id,
      instance_id: {in: instances.map(instance => instance.id)}
    },
      select: {
        instance_id: true,
      }
    })
    console.log(instancesUserIsIn)
  }

  prisma.disconnect()


  return {props: {instances}}
}
