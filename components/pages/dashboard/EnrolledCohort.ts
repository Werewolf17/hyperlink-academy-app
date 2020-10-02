import h from 'react-hyperscript'
import { Box } from 'components/Layout'
import { DateBox } from 'components/DateBox'
import Link from 'next/link'
import { Pill } from 'components/Pill'
import { getTimeBetween } from 'src/utils'
import styled from '@emotion/styled'
import { Secondary } from 'components/Button'
import Text from 'components/Text'
import { colors } from 'components/Tokens'

type Props = {
  cohort: {
    live: boolean,
    courses:{
      name: string,
      slug: string,
      id: number
      card_image: string,
    },
    id: number
    name: string
    cohort_events: {events: {
      start_date: string,
      end_date: string,
      location: string,
      name: string,
      description: string
    }}[]
  },
  facilitating: boolean,
}

export function EnrolledCohort(props: Props) {
  let events = props.cohort.cohort_events
    .filter((event)=> new Date() < new Date(event.events.end_date))
    .sort((a, b) => new Date(a.events.start_date) > new Date(b.events.start_date) ? 1 : -1)
  let first_event = events[0]?.events
  return h(Box, {gap:16}, [
    h(Box, {gap: 8}, [
      //course name
      h(Link, {
        href: `/courses/[slug]/[id]/cohorts/[cohortId]`,
        as: `/courses/${props.cohort.courses.slug}/${props.cohort.courses.id}/cohorts/${props.cohort.id}`
      }, h('a', {style:{textDecoration: 'none'}}, h('h2', props.cohort.courses.name))),
      //cohort number
      h(Box, {h: true, gap:16, style:{alignItems: 'center'}}, [
        h('h3.textSecondary', `Cohort #${props.cohort.name}`),
        props.facilitating ? h(Pill, {borderOnly: true}, 'facilitator') : null,
        !props.cohort.live ? h(Pill, {red: true, borderOnly: true}, "draft") : null
      ])
    ]),
    !first_event ? null :  h(Container, [
      //course image
      h(Image, {src: props.cohort.courses.card_image}),

      //first event
      !first_event ? null : h(FirstEvent, [
        //date box
        h(Box, {h: true, style:{gridAutoColumns: 'min-content auto'}}, [
          h('div', [
            h('div', {style: {backgroundColor: "black", color: 'white', padding: '4px 0px', textAlign: 'center'}}, "NEXT"),
            h(DateBox, {date: new Date(first_event.start_date)}),
          ]),
          //event header
          h(Box, {gap: 4, style: {paddingTop:4, gridTemplateRows: "min-content minmax(1.875rem, 3.75rem) min-content"}}, [
            h('b.textSecondary',
              (new Date(first_event.start_date)).toLocaleDateString([], {weekday: 'long'}).toUpperCase() +
              ` | ` + getTimeBetween(new Date(first_event.start_date), new Date(first_event.end_date)) + 'hrs'),
            h('h3', {style: {overflow:"hidden"}}, first_event.name),
            h('a', {href: first_event.location}, h(Secondary, "Join Event"))
          ])
        ]),
        //event description
        h(Link, {
          passHref: true,
        href: `/courses/[slug]/[id]/cohorts/[cohortId]`,
        as: `/courses/${props.cohort.courses.slug}/${props.cohort.courses.id}/cohorts/${props.cohort.id}`
        },  h('a',  {
          style: {color: colors.textPrimary, textDecoration: 'none'}
        }, h(Box, {style: {overflowY: "hidden"}}, [
                h(Text, {source: first_event.description})
              ])
             ))
    ]),

      // 2nd 3rd 4th event list
      h(Box, [
        ...events.slice(1, 4).map(cohort_event=> {
        let event = cohort_event.events
        return h(UpcomingEvent, [
          h(DateBox, {date: new Date(event.start_date)}),
          h(UpcomingEventContent, [
            h('b.textSecondary',
              (new Date(event.start_date)).toLocaleDateString([], {weekday: 'long'}).toUpperCase() +
              ` | ` + getTimeBetween(new Date(event.start_date), new Date(event.end_date)) + 'hrs'),
            h('h3', event.name),
          ])
        ])
      }),
        //show all events 
        h(Link, {
          href: `/courses/[slug]/[id]/cohorts/[cohortId]`,
          as: `/courses/${props.cohort.courses.slug}/${props.cohort.courses.id}/cohorts/${props.cohort.id}`
        }, h('a', {style: {color: colors.textSecondary, justifySelf:"right"}}, `See all events`)),
      ])
    ])
  ])
}

const Image = styled('img')`
border: 1px solid;
image-rendering: pixelated;
image-rendering: crisp-edges;
height: 370px;
width: 166px;

@media(max-width: 1024px) {
display: none;
}
`

const Container = styled('div')`
height: 370px;
display: grid;
grid-gap: 16px;

grid-auto-columns: max-content;
grid-auto-flow: column;

grid-template-columns: min-content auto 320px;

@media(max-width: 1024px) {
grid-template-columns: auto 320px;
height: min-content;
height: 370px;
}

@media(max-width:768px) {
grid-template-columns: auto;
grid-auto-rows: min-content;
grid-auto-flow: row;
height: auto;
}
`

const FirstEvent = styled('div')`
height: 370px; 
display: grid;
grid-row-gap: 16px;
grid-auto-rows: min-content auto;
position: relative;
overflow: hidden;

::after {
  content: '';
  position: absolute;
  height: 370px;
  width: 100%;
  background:linear-gradient(transparent 320px, ${colors.appBackground});
  pointer-events: none;
 }

@media(max-width: 768px) {
  height: auto;

  ::after{
    display:none;
    height: auto
  }
}
`

const UpcomingEvent = styled('div')`
display: grid;
grid-column-gap: 16px;
grid-template-columns: min-content auto;
`

const UpcomingEventContent = styled('div')`
display: grid;
grid-row-gap: 4px;
grid-template-rows: min-content 3.75rem;
overflow: hidden;
height: min-content;
padding-top: 8px
`
