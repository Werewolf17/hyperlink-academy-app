import h from 'react-hyperscript'

import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {useState} from 'react'
import { InferGetStaticPropsType } from 'next'

import Enroll from '../../../components/Course/Enroll'
import { TwoColumn, Box, Seperator, Sidebar} from '../../../components/Layout'
import { Tabs } from '../../../components/Tabs'
import { Pill } from '../../../components/Pill'
import { Primary, Destructive, Secondary} from '../../../components/Button'
import Loader, { PageLoader } from '../../../components/Loader'
import { Info } from '../../../components/Form'
import { Modal } from '../../../components/Modal'
import {TwoColumnBanner} from '../../../components/Banner'
import Text from '../../../components/Text'

import {prettyDate} from '../../../src/utils'
import { getTaggedPost } from '../../../src/discourse'
import { callApi, useApi } from '../../../src/apiHelpers'
import { cohortDataQuery, courseDataQuery } from '../../api/get/[...item]'
import { CompleteCohortMsg, CompleteCohortResponse, EnrollMsg, EnrollResponse, UpdateCohortMsg, UpdateCohortResponse } from '../../api/courses/[action]'
import { useCohortData, useUserData, useCourseData } from '../../../src/data'
import { cohortPrettyDate } from '../../../components/Card'
import ErrorPage from '../../404'
import { useStripe } from '@stripe/react-stripe-js'

const COPY = {
  detailsTab: "Details",
  artifactsTab: "Artifacts",
  curriculumTab: "Curriculum",
  backToCourse: 'back to the course',
  details: "Details",
  participants: "Participants",
  updateNotes: (props: {id: string}) => h(Info, [
    `💡 You can make changes to the cohort details by editing `,
    h('a', {href: `https://forum.hyperlink.academy/t/${props.id}`}, `this topic`),
    ` in the forum`
  ])
}

type Props = InferGetStaticPropsType<typeof getStaticProps>
const WrappedCohortPage = (props: Props)=>  props.notFound ? h(ErrorPage) : h(CohortPage, props)
export default WrappedCohortPage
const CohortPage = (props: Extract<Props, {notFound:false}>) => {
  let router = useRouter()
  let {data: user} = useUserData()
  let {data: cohort} = useCohortData(props.id, props.cohort)
  let {data: course} = useCourseData(props.courseId, props.course)
  if(!cohort) return h(PageLoader)

  let inCohort = cohort.people_in_cohorts.find(p => p.person === (user ? user.id : undefined))
  let isFacilitator  = !!user && cohort.people.username === user.username
  let isStarted = cohort && new Date() > new Date(cohort.start_date)

  return h('div', {}, [
    h(WelcomeModal, {display:router.query.welcome !== undefined, cohort}),
    h(Banners, {...cohort, enrolled: !!inCohort, facilitating: isFacilitator}),
    h(TwoColumn, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', COPY.backToCourse))]),
          h(Box, {gap:4}, [
            h('h1', cohort?.courses.name),
            h('h3.textSecondary', 'Cohort #'+cohort?.id.split('-').slice(-1)[0]),
          ]),
          h('span', [
            cohortPrettyDate(cohort.start_date, cohort.completed), h('span', ' | '),
            `Facilitated by ${cohort.people.display_name}`
          ]),
        ]),
        !inCohort && !isFacilitator ? null : h(Box, [
          h('a', {href: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.courses.id}/${cohort.id}`}
            , h(Primary, 'Go to the forum')),
          !cohort.completed && isFacilitator && isStarted ? h(MarkCohortComplete, {id:props.id}) : null,
        ]),
      ]),
      h('div', {style: {gridColumn: 1}}, h(Tabs, {
          tabs: {
            [COPY.artifactsTab]: props.artifacts ? h(Text, {source: props.artifacts?.text}) : null,
            [COPY.detailsTab]: h(Box, {gap: 64}, [
              h(Box, {gap: 32},[
                isFacilitator ? h(COPY.updateNotes, {id: props.notes?.id}) : null,
                !props.notes ? null : h(Box, [
                  h('h3', COPY.details),
                  h(Text, {source: props.notes?.text})
                ]),
                h(Box, {gap:16}, !cohort ? [] : [
                  h('h3', COPY.participants),
                  h(LearnerEntry, [
                    h(Link, {
                      href: '/people/[id]',
                      as: `/people/${cohort.people.username}`
                    }, h('a', {className: 'notBlue'}, cohort.people.display_name || cohort.people.username)),
                    h(Pill, {borderOnly: true}, 'facilitator')
                  ]),
                  h(Seperator),
                  ...cohort.people_in_cohorts
                    .map((person)=>{
                      return h(LearnerEntry, [
                        h(Link, {
                          href: '/people/[id]',
                          as: `/people/${person.people.username}`
                        }, h('a', {className: 'notBlue'},person.people.display_name || person.people.username))])
                    })])
              ] )
            ]),
            [COPY.curriculumTab]: h(Text, {source:props.curriculum?.text})
          }
      })),
      inCohort || isFacilitator ? null
        : h(Sidebar, {} ,h(Enroll, {course}, h(EnrollInCohort, {id: props.id, course: props.courseId})))
    ])
  ])
}

let LearnerEntry = styled('div')`
display: grid;
grid-template-columns: max-content min-content;
grid-gap: 16px;
`

const EnrollInCohort = (props:{id:string, course: string}) => {
    let {data: user} = useUserData()
    let stripe = useStripe()
    let router = useRouter()
    let [status, callEnroll] = useApi<EnrollMsg, EnrollResponse>([stripe], async (res)=>{
        if(res.zeroCost) await router.push('/courses/[id]/[cohortId]', `/courses/${props.course}/${props.id}?welcome`)
        else await stripe?.redirectToCheckout({sessionId: res.sessionId})
    })

  let onClick= async (e:React.MouseEvent)=> {
    e.preventDefault()
    if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!props.id) return
    if(!stripe) return
    await callEnroll('/api/courses/enroll', {cohortId: props.id})
  }

  return  h(Primary, {onClick}, status === 'loading' ? h(Loader) : ' Join this Cohort')
}

const MarkCohortLive = (props:{id: string})=> {
  let {data: cohort, mutate} = useCohortData(props.id)
  let [state, setState] = useState<'normal' | 'confirm' | 'loading'| 'complete' >('normal')

  if(state === 'confirm' || state === 'loading') return h(Modal, {display: true, onExit: ()=> setState('normal')}, [
    h(Box, {gap: 32}, [
      h('h2', "Are you sure?"),
      h(Box, {gap: 16}, [
        'Before going live please check that you’ve done these things!',
        h(Box.withComponent('ul'), {gap: 16}, [
          h('li', "Write  the 'notes' topic for any details relevant to your cohort"),
          h('li', "Fill out the 'Getting Started' topic for the first things learners should do when they enroll.")
        ]),
        h('p', [`Check out the `, h('a', {href: 'https://hyperlink.academy/manual/facilitators#creating-a-new-cohort'}, 'facilitator guide'), ' for more details']),
        h(Box, {gap: 16, style: {textAlign: 'right'}}, [
          h(Primary, {onClick: async e => {
            e.preventDefault()
            if(!cohort) return
            setState('loading')
            let res = await callApi<UpdateCohortMsg, UpdateCohortResponse>('/api/courses/updateCohort', {cohortId:cohort.id, data: {live: true}})
            if(res.status === 200) mutate({...cohort, live: res.result.live})
            setState('complete')
          }}, state === 'loading' ? h(Loader) : 'Go Live'),
          h(Secondary, {onClick: ()=> setState('normal')}, "Nevermind")
        ])
      ]),
    ])
  ])

  return h(Destructive, {onClick: async e => {
    e.preventDefault()
    setState('confirm')
  }}, 'Go Live!')
}

const MarkCohortComplete = (props:{id: string})=> {
  let {data: cohort, mutate} = useCohortData(props.id)
  let [state, setState] = useState<'normal' | 'confirm' | 'loading'| 'complete' >('normal')

  if(state === 'confirm' || state === 'loading') return h(Modal, {display: true, onExit: ()=> setState('normal')}, [
    h(Box, {gap: 32}, [
      h('h2', "Are you sure?"),
      h(Box, {gap: 16}, [
        'Before closing this course, please check that you’ve done these things!',
        h(Box.withComponent('ul'), {gap: 16}, [
          h('li', "Write a retrospective in your cohort forum"),
          h('li', "Post any artifacts the cohort created in the artifact topic in the course form")
        ]),
        h(Box, {gap: 16, style: {textAlign: "right"}}, [
          h(Primary, {onClick: async e => {
            e.preventDefault()
            if(!cohort) return
            setState('loading')
            let res = await callApi<CompleteCohortMsg, CompleteCohortResponse>('/api/courses/completeCohort', {cohortId:cohort.id})
            if(res.status === 200) mutate({...cohort, completed: res.result.completed})
            setState('complete')
          }}, state === 'loading' ? h(Loader) : 'Mark this cohort complete'),
          h(Secondary, {onClick: ()=> setState('normal')}, "Nevermind")
        ])
      ]),
    ])
  ])

  return h(Destructive, {onClick: async e => {
    e.preventDefault()
    setState('confirm')
  }}, 'Mark as complete')
}

const WelcomeModal = (props: {display:boolean, cohort:{start_date: string, id: string, courses: {id: string}}}) => {
  return h(Modal, {display:props.display}, [
    h(Box, {gap: 32}, [
      h('h2', "You're enrolled!"),
      h(Info, {}, h('b', `This cohort starts on ${prettyDate(props.cohort.start_date)}`)),
      h('p',
        `For now, you can head to the cohort form to introduce yourself see what you
you'll be doing on your first day`),
      h('a', {
        style: {margin: 'auto'},
        href: `https://forum.hyperlink.academy/session/sso?return_path=/c/${props.cohort.courses.id}/${props.cohort.id}`
      }, h(Primary, "Get started")),
      h(Link, {
        href:'/courses/[id]/[cohortId]',
        as: `/courses/${props.cohort.courses.id}/${props.cohort.id}`
      }, h('a', 'Back to the cohort page'))
    ])
  ])
}

const Banners = (props:{
  completed:string | null,
  facilitating?: boolean,
  enrolled?: boolean,
  start_date: string,
  live: boolean,
  id: string,
  courses:{id: string}
})=>{
  let isStarted = (new Date(props.start_date)).getTime() - (new Date()).getTime()
  let forum = `https://forum.hyperlink.academy/session/sso?return_path=/c/${props.courses.id}/${props.id}`

  if(props.facilitating && !props.live) return h(TwoColumnBanner, {red: true}, h(Box, {gap:16}, [
    h(Box, {gap: 8, className: "textSecondary"}, [
      h('h4', `This cohort isn't live yet!`),
      h('p', `This cohort is hidden from public view. You can make edits to the cohort forum and the topics within.`),
      h('p', `When you're ready click the button below to put the cohort live on the site`),
    ]),
    h(MarkCohortLive, {id: props.id})
  ]))

  if(props.completed)  return h(TwoColumnBanner, [
    h(Box, {gap: 8, className: "textSecondary"}, [
      h('h4', `You completed this course on ${prettyDate(props.completed || '')}!`),
      h('p', [`This cohort's `, h('a', {href: forum}, 'private forum'), ` will always be open! Feel free to come back whenever`])
    ])
  ])

  if(isStarted > 0 && (props.enrolled || props.facilitating)) {
    if(props.facilitating) {
      return h(TwoColumnBanner, [
          h(Box, {gap: 8, className: "textSecondary"}, [
            h('h4', `You're facilitating in ${Math.round(isStarted / (1000 * 60 * 60 * 24))} days `),
            h('p', [
              `Check out the `,
              h('a', {href: forum}, 'forum'),
              ` and meet the learners. You can also read our `, h('a', {href: "/manual/facilitators"}, 'facilitator guide'), `in the Hyperlink Manual`
            ])
          ])
      ])
    }
    return h(TwoColumnBanner, [
        h(Box, {gap: 8, className: "textSecondary"}, [
          h('h4', `You start in ${Math.round(isStarted / (1000 * 60 * 60 * 24))} days `),
          h('p', [
            `Check out the `,
            h('a', {href: forum}, 'forum'),
            ` while you're waiting. You can introduce yourself and learn more about what you'll be doing when your cohort starts!`
          ])
        ])
    ])
  }
  return null
}

export const getStaticProps = async (ctx:any)=>{
  let cohortId = (ctx.params?.cohortId || '' )as string
  let courseId = (ctx.params?.id || '' )as string

  let cohort = await cohortDataQuery(cohortId)
  let course = await courseDataQuery(courseId)

  if(!cohort || !course) return {props: {notFound: true}} as const

  let notes = await getTaggedPost(courseId + '/' + cohortId, 'note')
  let curriculum = await getTaggedPost(ctx.params.id, 'curriculum')
  let artifacts = await getTaggedPost(ctx.params.id, 'artifact')
  return {props: {notFound: false, id:cohortId, cohort, courseId, course, notes, curriculum, artifacts}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
