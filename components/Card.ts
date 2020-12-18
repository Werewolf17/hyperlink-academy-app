import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'

import {colors, Mobile} from './Tokens'
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
color: inherit;
}
`
export default Card

type Cohort = {
  name: string,
  start_date: string,
  people: {display_name?:string | null,
           username:string},
  completed?: string | null,
  live: boolean,
  enrolled?:boolean,
  facilitating?: boolean,
  id: number,
  courses: {
    name: string,
    slug: string
  }
  course: number,
}
export const SmallCohortCard = (props: Cohort) => {
  let started = new Date(props.start_date) < new Date()
  return h(Link, {
    href: "/courses/[slug]/[id]/cohorts/[cohortId]",
    as:`/courses/${props.courses.slug}/${props.course}/cohorts/${props.id}`,
    passHref: true,
  }, [
    h(Card, {style:{border: '1px solid', borderTop: '4px solid', borderRadius: '2px'}}, [
      h(Box, {gap: 8}, [
        props.enrolled || props.facilitating ? h(Box, {gap: 8, h: true}, [
          props.facilitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
          props.enrolled ? h(Pill, 'enrolled') : null,
          !props.live ? h(Pill, {red: true, borderOnly: true},'draft') : null
        ]): null,
        h('div', [
          h('h4', `${started ? "Started" : "Starts"} ${prettyDate(props.start_date)}`),
          h('p', {style:{color: colors.textSecondary}},
            `Facilitated by ${props.people.display_name || props.people.username}`)
        ])
      ])
    ])
  ])
}

export const ClubCard = (props: {
  course: {slug: string, id: number, card_image: string, name: string, description: string},
  cohort?: {start_date: string, id: number}}) => {
  let started = props.cohort ? (new Date(props.cohort.start_date) < new Date()) : undefined
  return h(Link, {
    href: `/courses/${props.course.slug}/${props.course.id}`+ (props.cohort ? `/cohorts/${props.cohort?.id}` : '/settings'),
    passHref: true
  }, [
    h(ClubCardContainer, [
      h(Box, {style:{backgroundColor: colors.accentLightBlue, padding: '16px'}}, [
        h(Box, {h: true}, props.course.card_image.split(',').map(src=> h('img', {src}))),
        h('h3', {style:{height: '2.75em'}}, props.course.name)
      ]),
      h(ClubCardContent, [
        h('p', props.course.description),
        props.cohort ? h('p', `${started ? "Started" : "Starts"} ${prettyDate(props.cohort.start_date)}`) : ''
      ])
    ])
  ])
}

const ClubCardContent = styled('div')`
display: grid;
grid-template-rows: auto 22px;
height: 100%;
box-sizing: border-box;
grid-gap: 16px;
padding: 16px;
`

const ClubCardContainer = styled('a')`
max-width: 320px;
height: 352px;
background-color: white;
border: 1px solid;
display: grid;
grid-template-rows: min-content auto;
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

export const BigCohortCard = (props: Cohort & {courses: {name: string, slug: string}}) => {
  let now = new Date()
  let status: "Completed" | "Upcoming" | "Ongoing" = "Upcoming"
  if(now > new Date(props.start_date)) status = "Ongoing"
  if(props.completed) status = "Completed"

  return h(Link, {
    href: "/courses/[slug]/[id]/cohorts/[cohortId]",
    as:`/courses/${props.courses.slug}/${props.course}/cohorts/${props.id}`,
    passHref: true,
  }, [
    h(Card, {style:{border: '2px solid', borderTop: '4px solid', borderRadius: '2px'}}, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 8}, [
          props.enrolled || props.facilitating ? h(Box, {gap: 8, h: true}, [
            props.facilitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
            props.enrolled ? h(Pill, 'enrolled') : null,
          !props.live ? h(Pill, {red: true, borderOnly: true},'draft') : null
          ]): null,
          h('h3', props.courses.name+' '+props.name),
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

export function CourseCard(props:{
  name:string,
  description: string
  slug: string,
  id: number,
  card_image: string,
  status?:  'draft' | 'live' | 'archived' | null
  course_cohorts:{start_date: string}[]
}) {
  let upcomingCohort = props.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]

  return h(Link, {
    href: '/courses/[slug]/[id]',
    as: `/courses/${props.slug}/${props.id}`,
    passHref: true}, h(CourseCardContainer, {
  }, [
    h(ImageContainer, [
      props.status === 'draft' ? null : h(Image, {src: props.card_image}),
    ]),
    h(CardContent, [
      h('h3', props.name),
      h('p', {style: {overflow: 'hidden', height: '100%'}}, props.description),
      props.status === 'draft' ? h(Pill, {red: true, borderOnly: true}, 'draft')
        : !upcomingCohort ? null : h(DateContainer, ('Next cohort starts ') + prettyDate(upcomingCohort?.start_date))
    ])
  ]))
}

const CardContent = styled('div')`
display: grid;
padding: 16px;
grid-gap: 16px;
grid-template-rows: min-content auto 22px;
height: 100%;
box-sizing: border-box;
`

const Image = styled('img')`
image-rendering: pixelated;
image-rendering: crisp-edges;
`

const ImageContainer = styled('div')`
width: auto;
height: 300px;
overflow: hidden;
object-fit: none;
border-right: 2px solid;
${Mobile} {
display: none;
}
`

let DateContainer = styled('p')`
color: ${colors.textSecondary};
font-size: 12px;
`

let CourseCardContainer = styled(Card)`
padding: 0px;
display: grid;
border: 2px solid;
border-radius: 2px;
grid-template-columns: 132px auto;
max-height: 304px;
${Mobile} {
grid-template-columns: auto;
}
`

export const FlexGrid= styled('div')<{min: number, mobileMin: number}>`
width: 100%;
display: grid;
grid-template-columns: repeat(auto-fill, minmax(${props=>props.min}px, 1fr));

${Mobile} {
grid-template-columns: repeat(auto-fill, minmax(${props=>props.mobileMin}px, 1fr));
}
grid-gap: 32px;
`

export const cohortPrettyDate = (start_date: string, completed?: string | null)=>{
  if(completed) return `${prettyDate(start_date)} - ${prettyDate(completed || '')}`
  if(new Date() > new Date(start_date)) return `Started ${prettyDate(start_date)}`
  return `Starts ${prettyDate(start_date)}`
}
