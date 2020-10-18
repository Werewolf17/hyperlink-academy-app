import h from 'react-hyperscript'
import Link from 'next/link'
import { Cohort, Course, User, useUserCohorts } from "src/data";
import { Box, TwoColumn, Sidebar, WhiteContainer, Seperator} from "components/Layout";
import { prettyDate } from 'src/utils';
import { StickyWrapper } from 'components/Tabs';
import Enroll from 'components/Course/Enroll';
import { EnrollButton } from 'components/Course/EnrollButton';
import {LinkButton} from 'components/Button'
import { EmptyImg } from 'pages/dashboard';
import { CohortEvents } from './Events';
import { CreateEvent } from './CreateEvent';
import { CohortMembers } from 'pages/courses/[slug]/[id]/cohorts/[cohortId]';
import Text from 'components/Text'
import {colors} from 'components/Tokens'
import { useState } from 'react';
import { Info } from 'components/Form';

export function ClubPage(props:{
  cohort:Cohort,
  course: Course,
  curriculum: {
    text: string,
    id: string
  },
  user:User | undefined,
  mutate: (c:Cohort)=> void}) {
  let inCohort = props.cohort.people_in_cohorts.find(p => p.person === (props.user ? props.user.id : undefined))
  let isFacilitator  = !!props.user && props.cohort.people.username === props.user.username
  let isStarted = new Date() > new Date(props.cohort.start_date)
  let {data:userCohorts} = useUserCohorts()
  let [showDetails, setShowDetails] = useState(false)
  let invited = !!userCohorts?.invited_courses.find(course=>course.id === props.course.id )

  return h(Box, {gap:32}, [
    h(TwoColumn, [
      h('div', {style: {gridColumn: 1}}, [
        h(Box, {gap: 32}, [
          h(Box, {gap: 8}, [
            h(Box, {h: true}, props.course.card_image.split(',').map(src=>h('img', {src}))),
            h('h1', props.course.name),
            h('h2.textSecondary', props.cohort.completed
              ? `Completed ${prettyDate(props.cohort.completed)}`
              : `${isStarted ? "Started" : "Starts"} ${prettyDate(props.cohort.start_date)}`),
          ]),
          h('p.big', props.course.description),
          h(Box, [
            h(LinkButton, {onClick: ()=>setShowDetails(!showDetails)}, showDetails ? "hide details" : "show details"),
            showDetails ? h('div', {style:{color: colors.textSecondary}}, [
              h(Info, [
                `💡 You can make changes to the club details by editing `,
                h('a', {href: `https://forum.hyperlink.academy/session/sso?return_path=/t/${props.curriculum.id}`}, `this topic`),
                ` in the forum`
              ]),
              h(Text, {source:props.curriculum?.text})
            ]) : null
          ]),
          inCohort || isStarted || isFacilitator ? null : h(EnrollButton, {id: props.cohort.id, course: props.course.id, max_size: props.course.cohort_max_size, learners: props.cohort.people_in_cohorts.length, invited: !props.course.invite_only || invited}, "Join this club")
        ])
      ]),
      h(Seperator),
      h(Box, {gap: 32}, [
        !isFacilitator && props.cohort.cohort_events.length === 0 ? null : h(Box, {gap:32}, [
          isFacilitator ? h(CreateEvent, {cohort: props.cohort.id, mutate: (c)=>{
            props.mutate({...props.cohort, cohort_events: [...props.cohort.cohort_events, c]})
          }}) : null,
          (inCohort || isFacilitator) && props.cohort.cohort_events.length > 0 ? h(Link, {href: "/calendar"}, h(LinkButton, {
            textSecondary: true,
          }, 'add to your calendar')) : null,
          props.cohort.cohort_events.length === 0 ? h(WhiteContainer, [
            h(Box, {gap:16, style: {maxWidth: 400, textAlign: 'center', margin: 'auto'}}, [
              h( EmptyImg, {src: '/img/empty.png'}),
              h('small.textSecondary', "Events are great for scheduling live calls or other important cohort dates. Learners can add these to thier calendars. Looks like you haven't created any events yet. Hit the button above to schedule one!!" ),
            ])]) :
            h(CohortEvents, {facilitating: isFacilitator, cohort: props.cohort.id, events: props.cohort.cohort_events.map(event => event.events), mutate: (events)=>{
              props.mutate({
                ...props.cohort, cohort_events: events.map(event=>{
                  return{events: {...event, location: event.location || ''}}})})
            }})
        ]),
        h(Seperator),
        h(CohortMembers, {cohort: props.cohort, isFacilitator})
      ]),
      h(Sidebar, [
        inCohort ? null : h(StickyWrapper, [
          h(Box, {gap:32}, [
            h(Enroll, {course: props.course})
          ])
        ])
      ])
    ])
  ])
}
