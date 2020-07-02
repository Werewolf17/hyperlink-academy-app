import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'

import {colors} from './Tokens'
import {Box} from './Layout'
import { Pill } from './Pill'
import {prettyDate} from '../src/utils'

const Card = styled('a')`
box-sizing: border-box;
padding: 16px;
background-color: white;
border: 1px solid;
border-color: ${colors.grey15};
text-decoration: none;

color: ${colors.textPrimary};

&:visited {
color: inherit;
}

&:hover, &:active, &:focus {
cursor: pointer;
box-shadow: 4px 4px ${colors.grey15};
}
`
export default Card

type Cohort = {
  start_date: string,
  people: {display_name?:string | null,
           username:string},
  completed?: string | null,
  live: boolean,
  enrolled?:boolean,
  facilitating?: boolean,
  id: string,
  course: string,
}
export const SmallCohortCard = (props: Cohort) => {
  return h(Link, {
    href: "/courses/[id]/[cohortId]",
    passHref: true,
    as:`/courses/${props.course}/${props.id}`
  }, [
    h(Card, {style:{border: '1px solid', borderTop: '4px solid', borderRadius: '2px'}}, [
      h(Box, {gap: 8}, [
        props.enrolled || props.facilitating ? h(Box, {gap: 8, h: true}, [
          props.facilitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
          props.enrolled ? h(Pill, 'enrolled') : null,
          !props.live ? h(Pill, {red: true, borderOnly: true},'draft') : null
        ]): null,
        h('div', [
          h('h4', `Starts ${prettyDate(props.start_date)}`),
          h('p', {style:{color: colors.textSecondary}},
            `Facilitated by ${props.people.display_name || props.people.username}`)
        ])
      ])
    ])
  ])
}

export const BigCohortCard = (props: Cohort & {courses: {name: string}}) =>{
  let now = new Date()
  let status: "Completed" | "Upcoming" | "Ongoing" = "Upcoming"
  if(now > new Date(props.start_date)) status = "Ongoing"
  if(props.completed) status = "Completed"

  return h(Link, {
    href: "/courses/[id]/[cohortId]",
    passHref: true,
    as:`/courses/${props.course}/${props.id}`
  }, [
    h(Card, {style:{border: '2px solid', borderTop: '4px solid', borderRadius: '2px'}}, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 8}, [
          props.enrolled || props.facilitating ? h(Box, {gap: 8, h: true}, [
            props.facilitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
            props.enrolled ? h(Pill, 'enrolled') : null,
          !props.live ? h(Pill, {red: true, borderOnly: true},'draft') : null
          ]): null,
          h('h3', props.courses.name),
          h('p.textSecondary', `Cohort #${props.id.split('-').slice(-1)[0]}`)
        ]),
        h('div', [
          h('b', status),
          h('p.textSecondary', {}, cohortPrettyDate(props.start_date, props.completed)),
          h('p.textSecondary', `Facilitated by ${props.people.display_name || props.people.username}`)
        ] )
      ])
    ])
  ])
}

export const cohortPrettyDate = (start_date: string, completed?: string | null)=>{
  if(completed) return `${prettyDate(start_date)} - ${prettyDate(completed || '')}`
  if(new Date() > new Date(start_date)) return `Started ${prettyDate(start_date)}`
  return `Starts ${prettyDate(start_date)}`
}
