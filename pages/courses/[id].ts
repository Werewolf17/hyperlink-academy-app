import h from 'react-hyperscript'
import styled from 'styled-components'

import { Box, MediumWidth } from '../../components/Layout'
import { PrismaClient, coursesGetPayload } from '@prisma/client'
import { GetStaticProps } from 'next'
import { Category } from '../../src/discourse'

import Enroll from '../../components/Course/Enroll'

export default (props:CourseData) => {
  return h(Box, {gap: 48}, [
    h(Box, {gap: 8}, [
      h('h1', props.name),
      h('a',{href:'https://forum.hyperlink.academy/c/courses/the-meta-course'},  'Check out the course forum')
    ]),
    h(Layout, [
      h(Side, [
        h(Info, [
          h(Enroll, {instances: props.course_instances, cost: props.cost, duration: props.duration})
        ])
      ]),
      h(Content, [
        h('div', [
          props.content
        ]),
        h('hr'),
        h('h2', 'Curriclum')
      ]),
    ])
  ])
}

const Side = styled('div')`
grid-column: 2;
grid-row: 1;
@media(max-width: 1016px) {
  grid-column: 1;
}
`

const Content  = styled(MediumWidth)`
margin: 0;
grid-column: 1;
grid-row: 1;
grid-column: 1;

display: grid;
grid-auto-rows: min-content;
grid-gap: 48px;

@media(max-width: 1016px) {
  grid-row: 2;
}
`

const Layout = styled('div')`
display: grid;
grid-template-columns: auto auto;
grid-gap: 16px;

@media(max-width: 1016px) {
grid-tempalte-columns: auto;
grid-template-rows: auto auto;
}
`

const Info = styled('div')`
width: 240px;
position: sticky;
top: 32px;
`


export const getStaticPaths = async () => {
  let prisma = new PrismaClient({
    forceTransactions: true
  })
  let courses = await prisma.courses.findMany({
    select: {
      id: true
    }
  })
  return {
    paths: courses.map(course => {
      return {params: {id: course.id}}
    }),
    fallback: false
  }
}

export type CourseData = coursesGetPayload<{include: {course_instances: true}}> & {content: string}
export const getStaticProps:GetStaticProps= async (ctx) => {
  let id = (ctx.params?.id || '' )as string
  let prisma = new PrismaClient({
    forceTransactions: true
  })
  let data = await prisma.courses.findOne({
    where: {id},
    include: {course_instances: true}
  })
  await prisma.disconnect()
  let content = await getCourseContent(id)
  return {props: {...data, content} as CourseData, }
}

export const getCourses =  async () => {
}

const getCourseContent = async (id:string) => {
  let res = await fetch('https://forum.hyperlink.academy/c/courses/' + id + '.json')
  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find(topic => topic.pinned === true)?.id
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID)
  return await topicRequest.text()
}
