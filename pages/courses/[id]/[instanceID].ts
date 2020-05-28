import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState } from 'react'
import { InferGetStaticPropsType } from 'next'

import Enroll from '../../../components/Course/Enroll'
import { TwoColumn, Box, Seperator, Sidebar} from '../../../components/Layout'
import { colors, Mobile } from '../../../components/Tokens'
import { Tabs } from '../../../components/Tabs'
import { Pill } from '../../../components/Pill'
import { Primary, Destructive, Secondary} from '../../../components/Button'
import Loader from '../../../components/Loader'
import { Info } from '../../../components/Form'
import { Modal } from '../../../components/Modal'
import {Text} from '../../../components/Text'

import { getTaggedPostContent } from '../../../src/discourse'
import { callApi } from '../../../src/apiHelpers'
import { instanceDataQuery, courseDataQuery } from '../../api/get/[...item]'
import { CompleteInstanceMsg, CompleteInstanceResponse } from '../../api/courses/[action]'
import { useInstanceData, useUserData, useCourseData } from '../../../src/data'
import { instancePrettyDate } from '../../../components/Card'

type Props = InferGetStaticPropsType<typeof getStaticProps>
const InstancePage = (props:Props) => {
  let router = useRouter()
  let {data: user} = useUserData()
  let {data: instance} = useInstanceData(props.id, props.instance || undefined)
  let {data: course} = useCourseData(props.courseId, props.course || undefined)
  if(instance === false) return null

  let inInstance = instance?.people_in_instances.find(p => p.person_id === (user ? user.id : undefined))
  let isFacilitator  = user && instance?.people.username === user.username
  let isStarted = instance && new Date() > new Date(instance.start_date)

  return h('div', {}, [
    instance && (inInstance || isFacilitator)
      ? h(Banners, {...instance, enrolled: !!inInstance, facillitating: isFacilitator}) : null,
    h(TwoColumn, [
      !instance ? null : h(WelcomeModal, {display:router.query.welcome !== undefined, instance}),
      h(Box, {gap: 64}, [
        h(Box, {gap: 32}, [
          h(Box, {gap: 16}, [
            h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', 'back to the course'))]),
            h('h1', instance?.courses.name),
            h('span', [
              h('b', instance?.id), h('span', ' | '),
              instancePrettyDate(instance?.start_date || '', instance?.completed), h('span', ' | '),
              `Facillitated by ${instance?.people.display_name}`
            ]),
          ]),
          h(Box, [
            inInstance || isFacilitator
              ? h('a', {href: `https://forum.hyperlink.academy/c/${instance?.courses.id}/${instance?.id}`}
                  , h(Primary, 'Go to the forum')) : null,
            instance && !instance.completed && isFacilitator && isStarted ? h(MarkInstanceComplete, {id:props.id}) : null
          ]),
        ]),
      ]),
      h('div', {style: {gridColumn: 1}}, h(Tabs, {
          tabs: {
            "Instance Details": h(Box, {gap: 64}, [
              h(Box, {gap: 32},[
                h(Box, [
                  h(Text, props.notes)
                ]),
                h(Box, {gap: 8}, [
                  h('h3', 'Participants'),
                ]),
                h(Box, {gap:16}, !instance ? [] : [
                  h(LearnerEntry, [
                    h(Link, {
                      href: '/people/[id]',
                      as: `/people/${instance.people.username}`
                    }, h('a', {className: 'notBlue'}, instance.people.display_name || instance.people.username)),
                    h(Pill, {borderOnly: true}, 'facilitator')
                  ]),
                  h(Seperator),
                  ...instance.people_in_instances
                    .map((person)=>{
                      return h(LearnerEntry, [
                        h(Link, {
                          href: '/people/[id]',
                          as: `/people/${person.people.username}`
                        }, h('a', {className: 'notBlue'},person.people.display_name || person.people.username))])
                    })])
              ] )
            ]),
            "Curriculum": h(Text, props.curriculum)
          }
        })),
      inInstance || isFacilitator ? null
        : h(Sidebar, {} ,h(Enroll, {instanceId: props.id, course}))
    ])
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

let LearnerEntry = styled('div')`
display: grid;
grid-template-columns: max-content min-content;
grid-gap: 16px;
`

export default InstancePage

const MarkInstanceComplete = (props:{id: string})=> {
  let {data: instance, mutate} = useInstanceData(props.id)
  let [state, setState] = useState<'normal' | 'confirm' | 'loading'| 'complete' >('normal')

  if(state === 'confirm' || state === 'loading') return h(Modal, {display: true, onExit: ()=> setState('normal')}, [
    h(Box, {gap: 32}, [
      h('h2', "Are you sure?"),
      h(Box, {gap: 16}, [
        'Before closing this course, please check that you’ve done these things!',
        h(Box.withComponent('ul'), {gap: 16}, [
          h('li', "Write a retrospective in your instance forum"),
          h('li', "Post any artifacts the instance created in the artifact topic in the course form")
        ]),
        h(Primary, {onClick: async e => {
          e.preventDefault()
          if(!instance) return
          setState('loading')
          let res = await callApi<CompleteInstanceMsg, CompleteInstanceResponse>('/api/courses/completeInstance', {instanceId:instance.id})
          if(res.status === 200) mutate({...instance, completed: res.result.completed})
          setState('complete')
        }}, state === 'loading' ? h(Loader) : 'Mark this instance complete'),
        h(Secondary, {onClick: ()=> setState('normal')}, "Nevermind")
      ]),
    ])
  ])

  return h(Destructive, {onClick: async e => {
    e.preventDefault()
    setState('confirm')
  }}, 'Mark as complete')
}

const WelcomeModal = (props: {display:boolean, instance:{start_date: string, id: string, courses: {id: string}}})=>{
  return h(Modal, {display:props.display}, [
    h(Box, {gap: 32}, [
      h('h2', "You're enrollled!"),
      h(Info, {}, h('b', `This instance starts on ${prettyDate(props.instance.start_date)}`)),
      h('p',
        `For now, you can head to the instance form to introduce yourself see what you
you'll be doing on your first day`),
      h('a', {
        style: {margin: 'auto'},
        href: `https://forum.hyperlink.academy/c/${props.instance.courses.id}/${props.instance.id}`
      }, h(Primary, "Get started")),
      h(Link, {
        href:'/courses/[id]/[instanceID]',
        as: `/courses/${props.instance.courses.id}/${props.instance.id}`
      }, 'Back to the instance page')
    ])
  ])
}

const Banners = (props:{
  completed:string | null,
  facillitating?: boolean,
  enrolled?: boolean,
  start_date: string,
  id: string,
  courses:{id: string}
})=>{
  let isStarted = (new Date(props.start_date)).getTime() - (new Date()).getTime()
  let forum = `https://forum.hyperlink.academy/c/${props.courses.id}/${props.id}`

  if(props.completed)  return h(Banner, {}, h(Box, {width:904, ma: true, style: {padding:'32px'}}, h(BannerInner, [
    h(Box, {gap: 8, className: "textSecondary"}, [
      h('h4', `You completed this course on ${prettyDate(props.completed || '')}!`),
      h('p', [`This instance's `, h('a', {href: forum}, 'private forum'), ` will always be open! Feel free to come back whenever`])
    ])
  ])))

  if(isStarted > 0 && (props.enrolled || props.facillitating)) {
    return h(Banner, {}, [
      h(Box, {width: 904, ma: true, padding: 32}, h(BannerInner, [
        h(Box, {gap: 8, className: "textSecondary"}, [
          h('h4', `You start in ${Math.round(isStarted / (1000 * 60 * 60 * 24))} days `),
          h('p', [
            `Check out the `,
            h('a', {href: forum}, 'forum'),
            ` while you're waiting. You can introduce yourself and learn more about what you'll be doing when the course starts!`
          ])
        ])
      ]))
    ])
  }
  return null
}

const BannerInner = styled('div')`
display: grid;
grid-template-columns: 2fr 1fr;
grid-gap: 64px;
@media(max-width: 768px) {
grid-template-columns: auto;
grid-template-rows: auto ;
}
`

const Banner = styled('div')<{red?: boolean}>`

background-color: ${props => props.red ? colors.accentRed: colors.grey95};
position: relative;
width: calc(100vw);
position: relative;
left: calc(50% - 50vw);
margin-bottom: 16px;
margin-top: -48px;
${Mobile}{
margin-top: 0px
}
`

export const getStaticProps = async (ctx:any)=>{
  let instanceId = (ctx.params?.instanceID || '' )as string
  let courseId = (ctx.params?.id || '' )as string

  let instance = await instanceDataQuery(instanceId)
  let course = await courseDataQuery(courseId)

  let notes= await getTaggedPostContent(courseId + '/' + instanceId, 'note')
  let curriculum = await getTaggedPostContent(ctx.params.id, 'curriculum')
  return {props: {id:instanceId, instance, courseId, course, notes, curriculum}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
