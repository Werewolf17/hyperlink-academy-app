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

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const InstancePage = (props:Props) => {
  let router = useRouter()
  let {data: user} = useUserData()
  let {data: instance} = useInstanceData(props.id, props.instance || undefined)
  if(instance === false) return null

  let userInInstance = instance?.people_in_instances.find(p => p.person_id === (user ? user.id : undefined))

  return h(TwoColumn, [
    h(Box, {gap: 64}, [
      h(Box, {gap: 16}, [
        h('div', {style:{color:'blue'}}, ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a', 'back to course'))]),
        h('h1', instance?.courses.name),
        h(Details, [
          h('b', instance?.id), h('span', '|'),
          `Starts ${prettyDate(instance?.start_date || '')}`, h('span', '|'),
          `Facillitated by ${instance?.people.display_name}`
        ]),
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
    userInInstance ? null : h(Enroll, {instanceId: router.query.instanceID as string, courseId: router.query.id as string}),
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

export const getStaticProps = async (ctx:any)=>{
  let id = (ctx.params?.instanceID || '' )as string
  let data = await instanceDataQuery(id)
  return {props: {id, instance: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
