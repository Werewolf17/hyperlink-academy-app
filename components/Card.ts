import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'

import {colors} from './Tokens'
import {Box} from './Layout'
import { Pill } from './Pill'

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

type Instance = {
  start_date: string,
  people: {display_name?:string | null,
           username:string},
  completed?: string | null,
  enrolled?:boolean,
  facillitating?: boolean,
  id: string,
  course: string,
}
export const SmallInstanceCard = (props: Instance) => {
  return h(Link, {
    href: "/courses/[id]/[instanceID]",
    passHref: true,
    as:`/courses/${props.course}/${props.id}`
  }, [
    h(Card, {style:{border: '1px solid', borderTop: '4px solid'}}, [
      h('h4', `Starts ${prettyDate(props.start_date)}`),
      h('p', {style:{color: colors.textSecondary}},
        `Facillitated by ${props.people.display_name || props.people.username}`)
    ])
  ])
}

export const BigInstanceCard = (props: Instance & {courses: {name: string}}) =>{
  let now = new Date()
  let status: "Completed" | "Upcoming" | "Ongoing" = "Upcoming"
  if(now > new Date(props.start_date)) status = "Ongoing"

  return h(Link, {
    href: "/courses/[id]/[instanceID]",
    passHref: true,
    as:`/courses/${props.course}/${props.id}`
  }, [
    h(Card, {style:{border: '2px solid', borderTop: '4px solid'}}, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 8}, [
          props.enrolled || props.facillitating ? h(Box, {gap: 8, h: true}, [
            props.facillitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
            props.enrolled ? h(Pill, 'enrolled') : null
          ]): null,
          h('h3', props.courses.name),
          h('p.textSecondary', `Instance #${props.id.split('-').slice(-1)[0]}`)
        ]),
        h('div', [
          h('b', status),
          h('p.textSecondary', {}, instancePrettyDate(props.start_date, props.completed)),
          h('p.textSecondary', `Facillitated by ${props.people.display_name || props.people.username}`)
        ] )
      ])
    ])
  ])
}

export const instancePrettyDate = (start_date: string, completed?: string | null)=>{
  if(completed) return `${prettyDate(start_date)} - ${prettyDate(completed || '')}`
  if(new Date() > new Date(start_date)) return `Started ${prettyDate(start_date)}`
  return `Starts ${prettyDate(start_date)}`
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
