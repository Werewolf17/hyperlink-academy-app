import h from 'react-hyperscript'
import styled from 'styled-components'
import { PrismaClient, coursesGetPayload } from '@prisma/client'
import { GetServerSideProps } from 'next'

import {getToken} from '../../src/token'
import { Box, colors } from '../../components/Layout'
import { Primary } from '../../components/Button'
import Enroll from '../../components/Course/Enroll'


type Props = coursesGetPayload<{include: {course_instances: {include: {people_in_instances: true}}}}>
export default (props:Props) => {
  let start_date = new Date(props.course_instances[0].start_date)
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  return h(Box, {gap: 48}, [
    h(Box, {gap: 8}, [
      h('h1', 'Internet Homesteading'),
      h('a',{href:'https://forum.hyperlink.academy/c/internet-homesteading'},  'Check out the course forum')
    ]),
    h(Main, [
      h(Box,{gap:16}, [
        h('p', `The internet, as large and loud it is, is a difficult place to settle.
Currently, it's a mining frontier. You can live there, sure, but you've gotta
sell your soul to the company store first.`),
        h('p', `There is an alternative. Going out and building your own home in the internet
wilderness. It's definitely a lot of work. You'll have to learn how websites
work, and how to hold your own. You'll have to learn how to write on the
internet, to further your goals, not a companies advertising business.`),
        h('p ', `Ultimately, it gives you a foundation in this crazy cyberspace that's all your own.`),
        props.course_instances[0].people_in_instances[0] ? null : h('h3', `The next instance starts ${start_date}`),
        props.course_instances[0].people_in_instances[0]
          ? h(Primary, {onClick: ()=>{
            window.location.assign( 'https://forum.hyperlink.academy/g/' + props.course_instances[0].id)
          }}, 'Your instance group')
          : h(Enroll, {instances: props.course_instances}),
      ]),
      h(Info,[
        h(Box, {gap:16}, [
          h(Cost, '$' + props.cost),
          h('b', '2 weeks'),
          h('hr'),
          h('p', ``)
        ])
      ])
      
    ])
  ])
}

const Info = styled('div')`
padding: 24px;
width: 240px;
box-sizing: border-box;
background-color: ${colors.grey95};
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

const Main = styled('div')`
display: grid;
grid-template-columns: auto auto;
grid-gap: 24px;
`

export const getServerSideProps:GetServerSideProps<Props> = async ({req}) => {
  let prisma = new PrismaClient()
  let user = getToken(req)
  let data = await prisma.courses.findOne({
    where: {id: 'internet-homesteading'},
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
  return {props: data as Props}
}
