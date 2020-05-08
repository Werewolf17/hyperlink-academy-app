import h from 'react-hyperscript'
import styled from 'styled-components'
import Markdown from 'react-markdown'

import { GetServerSideProps } from 'next'
import Link from 'next/link'

import { Category } from '../../../src/discourse'
import { Box, MediumWidth } from '../../../components/Layout'
import Enroll from '../../../components/Course/Enroll'
import Instances from '../../../components/Course/Instances'
import { useUserData, useCourseData } from '../../../src/data'

type Props =  {content: string, id: string}
const CoursePage = (props:Props) => {
  let {data: user} = useUserData()
  let {data: courseData} = useCourseData(props.id)
  let isMaintainer = (courseData?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  return h(Layout, [
    h(Side, [
      h(Info, [
        h(Instances, {id: props.id}),
        h(Enroll, {id: props.id})
      ])
    ]),
    h(Content, [
      h(Box, {gap: 8}, [
        h(Title, [
          h('h1', courseData?.name),
          isMaintainer ? h(Link, {href:'/courses/[id]/settings', as: `/courses/${props.id}/settings`}, h('a', 'settings')) : null,
        ]),
        h('a',{href:`https://forum.hyperlink.academy/c/${courseData?.id}`},  'Check out the course forum'),
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

export const getServerSideProps:GetServerSideProps<{content: string, id: string}>= async (ctx) => {
  let id = (ctx.params?.id || '' )as string
  ctx.res.setHeader('cache-control', 's-maxage=600, stale-while-revalidate')
  let content = await getCourseContent(id)
  return {props: {content, id}} as const
}

const getCourseContent = async (id:string) => {
  let res = await fetch(`https://forum.hyperlink.academy/c/${id}.json`)
  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find(topic => topic.pinned === true)?.id
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID)
  return await topicRequest.text()
}
