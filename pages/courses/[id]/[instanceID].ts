import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { useInstanceData, useUserData } from '../../../src/data'
import Link from 'next/link'
import Enroll from '../../../components/Course/Enroll'
import { TwoColumn, Box, Seperator} from '../../../components/Layout'
import { colors } from '../../../components/Tokens'
import { Tabs } from '../../../components/Tabs'
import { Pill } from '../../../components/Pill'
import { instanceDataQuery } from '../../api/get/[...item]'
import { Primary, Destructive } from '../../../components/Button'
import { callApi } from '../../../src/apiHelpers'
import { CompleteInstanceMsg, CompleteInstanceResponse } from '../../api/courses/[action]'
import { useState } from 'react'
import Loader from '../../../components/Loader'
import { Info } from '../../../components/Form'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const InstancePage = (props:Props) => {
  let router = useRouter()
  let {data: user} = useUserData()
  let {data: instance} = useInstanceData(props.id, props.instance || undefined)
  if(instance === false) return null

  let inInstance = instance?.people_in_instances.find(p => p.person_id === (user ? user.id : undefined))
  let isFacilitator  = user && instance?.people.username === user.username

  return h(TwoColumn, [
    h(Box, {gap: 64, style: {marginTop: "-38px"}}, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h('div', {style:{color:colors.textSecondary}}, ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', 'back to the course'))]),
          h('h1', instance?.courses.name),
          h(Details, [
            h('b', instance?.id), h('span', '|'),
            `Starts ${prettyDate(instance?.start_date || '')}`, h('span', '|'),
            `Facillitated by ${instance?.people.display_name}`
          ]),
        ]),
        h(Box, {h: true}, [
          inInstance || isFacilitator ? h(Primary.withComponent('a'), {href: `https://forum.hyperlink.academy/c/${instance?.courses.id}/${instance?.id}`}, 'Go to the forum') : null,
          instance && !instance.completed && isFacilitator ? h(MarkInstanceComplete, {id:props.id}) : null
        ]),
        instance && instance.completed && (inInstance || isFacilitator)
          ? h(CompleteBanner, instance) : null,
      ]),
      h(Tabs, {
        tabs: {
          "Instance Details": h(Box, {gap: 64}, [
            h(Box, {gap: 32},[
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
          "Curriculumn": h('div', [

          ])
        }
      })
    ]),
    inInstance ? null : h(Enroll, {instanceId: router.query.instanceID as string, courseId: router.query.id as string}),
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

let LearnerEntry = styled('div')`
display: grid;
grid-template-columns: max-content min-content;
grid-gap: 16px;
`

let Details = styled('span')`
color: ${colors.textSecondary};
display: grid;
grid-template-columns: repeat(5, max-content);
grid-gap: 16px;
`

export default InstancePage

const MarkInstanceComplete = (props:{id: string})=>{
  let {data: instance, mutate} = useInstanceData(props.id)
  let [loading, setLoading] = useState(false)
  return h(Destructive, {onClick: async e => {
    e.preventDefault()
    if(!instance) return
    setLoading(true)
    let res = await callApi<CompleteInstanceMsg, CompleteInstanceResponse>('/api/courses/completeInstance', {instanceId:instance.id})
    if(res.status === 200) mutate({...instance, completed: res.result.completed})
    setLoading(false)
  }}, loading ? h(Loader) : 'Mark as complete')
}

const CompleteBanner = (props:{completed:string | null, id: string, courses:{id: string}})=>{
  return h(Info, {style:{padding: '32px', marginBottom: '16px'}}, h(Box, {gap: 16}, [
    h('h3', `You completed this course on ${prettyDate(props.completed || '')}!`),
    h('p', [`This instance's `, h('a', {href: `https://forum.hyperlink.academy/c/${props.courses.id}/${props.id}`}, 'private forum'), ` will always be open! Feel free to come back whenever`])
  ]))
}

export const getStaticProps = async (ctx:any)=>{
  let id = (ctx.params?.instanceID || '' )as string
  let data = await instanceDataQuery(id)
  return {props: {id, instance: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
