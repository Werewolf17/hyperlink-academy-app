import h from 'react-hyperscript'
import styled from '@emotion/styled'
import Markdown from 'react-markdown'
import {PrismaClient} from '@prisma/client'

import Link from 'next/link'

import { Category } from '../../../src/discourse'
import { Box, MediumWidth } from '../../../components/Layout'
import { useUserData, useUserInstances, useCourseData } from '../../../src/data'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const CoursePage = (props:Props) => {
  let {data: user} = useUserData()
  let {data: course} = useCourseData(props.id, props.course || undefined)
  let {data: userInstances} = useUserInstances()

  let isMaintainer = (course?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  return h(Layout, [
    h(Side, [
      h(Info, [
        h('div', [
          h('h4', "Your Instances"),
          h('ul', userInstances?.course_instances
            .filter(instance => instance.course === props.id)
            .map(instance=> h('li', [
              h(Link, {href: "/courses/[id]/[instanceID]", as: `/courses/${props.id}/${instance.id}`}, h('a', instance.id))
            ])))
        ]),
        h('div', [
          h('h4', 'Upcoming Instances'),
          h('ul', course?.course_instances
            .filter(i => !userInstances?.course_instances.find(x => x.id === i.id))
            .map(instance => h('li', [
              h(Link, {href: "/courses/[id]/[instanceID]", as:`/courses/${props.id}/${instance.id}`},
                h('a', instance.id))
            ])))
        ])
      ])
    ]),
    h(Content, [
      h(Box, {gap: 8}, [
        h(Title, [
          h('h1', course?.name),
          isMaintainer ? h(Link, {href:'/courses/[id]/settings', as: `/courses/${props.id}/settings`}, h('a', 'settings')) : null,
        ]),
        h('a',{href:`https://forum.hyperlink.academy/c/${course?.id}`},  'Check out the course forum'),
      ]),
      h(Text, [
        h(Markdown,{source: props.content}),
      ]),
    ])
  ])
}

export default CoursePage

const Title = styled('div')`
display: grid;
grid-template-columns: auto auto;
align-items: center;
`

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
grid-gap: 48px;
grid-auto-rows: min-content;


@media(max-width: 1016px) {
grid-row: 2;
}
`

const Text = styled('div')`
h1 {
margin-bottom: 8px;
margin-top: 16px;
}

p {
margin-bottom: 16px;
}

li {
margin-bottom: 8px;
margin-top: 8px;
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

display: grid;
grid-gap: 48px;
grid-auto-rows: min-content;
`

export const getStaticProps = async (ctx:any) => {
  let id = (ctx.params?.id || '' )as string
  let content = await getCourseContent(id)

  let prisma = new PrismaClient({
    forceTransactions: true
  })

  let data = await prisma.courses.findOne({
    where: {id },
    include: {
      course_maintainers: {
        include: {
          people: {select: {display_name: true}}
        }
      },
      course_instances: {
        include: {
          people: {
            select: {
              display_name: true
            }
          }
        }
      }
    }
  })

  return {props: {content, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}

const getCourseContent = async (id:string) => {
  let res = await fetch(`https://forum.hyperlink.academy/c/${id}.json`)
  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find((topic) => topic.pinned === true)?.id
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID)
  return await topicRequest.text()
}
