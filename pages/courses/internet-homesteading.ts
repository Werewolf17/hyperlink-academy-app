import h from 'react-hyperscript'
import styled from 'styled-components'
import { PrismaClient, course_instancesGetPayload } from '@prisma/client'
import { GetServerSideProps } from 'next'
import { useStripe } from '@stripe/react-stripe-js'

import {getToken} from '../../src/token'
import {Msg, Response} from '../api/courses/enroll'
import { Box, colors } from '../../components/Layout'
import { Primary } from '../../components/Button'
import { useRouter } from 'next/router'
import { useUserContext } from '../_app'


type InstancesWithUser = course_instancesGetPayload<{include: {people_in_instances: true}}>
type Props = {
  instances: InstancesWithUser[]
}
export default (props:Props) => {
  let router = useRouter()
  let user = useUserContext()
  let stripe = useStripe()

  let start_date = new Date(props.instances[0].start_date)
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  return h(Main, [
    h(Box,{gap:16}, [
      h(Box, {gap: 8}, [
        h('h1', 'Internet Homesteading'),
        h('a',{href:'https://forum.hyperlink.academy/c/internet-homesteading'},  'Check out the course forum')
      ]),
      h('p', `The internet, as large and loud it is, is a difficult place to settle.
Currently, it's a mining frontier. You can live there, sure, but you've gotta
sell your soul to the company store first.`),
      h('p', `There is an alternative. Going out and building your own home in the internet
wilderness. It's definitely a lot of work. You'll have to learn how websites
work, and how to hold your own. You'll have to learn how to write on the
internet, to further your goals, not a companies advertising business.`),
      h('p ', `Ultimately, it gives you a foundation in this crazy cyberspace that's all your own.)
`),
      h('b', `The next instance starts ${start_date}`),
      props.instances[0].people_in_instances[0] ? h(Primary, {onClick: ()=>{
        // @ts-ignore
        window.location = 'https://forum.hyperlink.academy/g/' + props.instances[0].id
      } }, 'Your instance group')  :
      h(Primary, {
        onClick: async ()=>{
          if(!user) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
          if(!stripe) return
          let msg:Msg = {instanceID: props.instances[0].id}
          let res = await fetch('/api/courses/enroll', {
            method: "POST",
            body: JSON.stringify(msg)
          })
          if(res.status === 200) {
            let {sessionId}= await res.json() as Response
            stripe.redirectToCheckout({
              sessionId
            })
          }
        }
      }, 'Enroll'),
    ]),
    h(Info,[
      h(Box, {gap:16}, [
        h(Cost, '$' + props.instances[0].cost),
        h('p', 'This course is intense?')
      ])
    ])
  ])
}

const Info = styled('div')`
padding: 24px;
background-color: ${colors.grey95};
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

const Main = styled('div')`
display: grid;
grid-template-columns: auto auto;
`

export const getServerSideProps:GetServerSideProps<Props> = async ({req}) => {
  let prisma = new PrismaClient()
  let user = getToken(req)
  let instances = await prisma.course_instances.findMany({
    where: {
      course: 'internet-homesteading'
    },
    orderBy: {
      start_date: 'desc'
    },
    first: 1,
    include: {
      people_in_instances: {
        where: {person_id: user?.id || 'null'}
      }
    }
  })

  await prisma.disconnect()

  return {props: {instances}}
}
