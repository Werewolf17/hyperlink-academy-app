import h from 'react-hyperscript'

import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {useState} from 'react'
import { InferGetStaticPropsType } from 'next'

import Enroll from 'components/Course/Enroll'
import { TwoColumn, Box, Seperator, Sidebar} from 'components/Layout'
import { Tabs } from 'components/Tabs'
import { Pill } from 'components/Pill'
import { Primary, Destructive, Secondary, BackButton} from 'components/Button'
import Loader, { PageLoader } from 'components/Loader'
import { Info } from 'components/Form'
import { Modal } from 'components/Modal'
import {TwoColumnBanner} from 'components/Banner'
import Text from 'components/Text'

import {prettyDate} from 'src/utils'
import { getTaggedPost } from 'src/discourse'
import { callApi, useApi } from 'src/apiHelpers'
import { useCohortData, useUserData, useCourseData, Cohort } from 'src/data'
import { cohortPrettyDate } from 'components/Card'
import ErrorPage from 'pages/404'
import { useStripe } from '@stripe/react-stripe-js'
import { cohortDataQuery, UpdateCohortMsg, UpdateCohortResponse } from 'pages/api/cohorts/[cohortId]'
import { courseDataQuery } from 'pages/api/courses/[id]'
import { EnrollResponse } from 'pages/api/cohorts/[cohortId]/enroll'

const COPY = {
  detailsTab: "Details",
  artifactsTab: "Artifacts",
  curriculumTab: "Curriculum",
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
  let {data: cohort, mutate} = useCohortData(props.cohortId, props.cohort)
  let {data: course} = useCourseData(props.courseId, props.course)
  if(!cohort) return h(PageLoader)

  let inCohort = cohort.people_in_cohorts.find(p => p.person === (user ? user.id : undefined))
  let isFacilitator  = !!user && cohort.people.username === user.username
  let isStarted = cohort && new Date() > new Date(cohort.start_date)

  return h('div', {}, [
    h(WelcomeModal, {display:router.query.welcome !== undefined, cohort}),
    h(Banners, {cohort, mutate, enrolled: !!inCohort, facilitating: isFacilitator}),
    h(TwoColumn, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h(BackButton, {href: "/courses/[slug]/[id]", as: `/courses/${cohort.courses.slug}/${cohort.courses.id}`}, 'Course Details'),
          h(Box, {gap:4}, [
            h('h1', cohort?.courses.name),
            h('h3.textSecondary', 'Cohort '+cohort?.name),
          ]),
          h('span', [
            cohortPrettyDate(cohort.start_date, cohort.completed), h('span', ' | '),
            `Facilitated by ${cohort.people.display_name}`
          ]),
        ]),
        !inCohort && !isFacilitator ? null : h(Box, [
          h('a', {href: `https://forum.hyperlink.academy/session/sso?return_path=/c/${cohort.courses.category_id}/${cohort.id}`}
            , h(Primary, 'Go to the forum')),
          !isFacilitator ? null : h(Link, {
            href: "/courses/[slug]/[id]/cohorts/[cohortId]/templates",
            as: `/courses/${cohort.courses.slug}/${cohort.courses.id}/cohorts/${cohort.id}/templates`
          }, h(Secondary, 'New Forum Topic from Template')),
          !cohort.completed && isFacilitator && isStarted ? h(MarkCohortComplete, {cohort, mutate}) : null,
        ]),
      ]),
      h('div', {style: {gridColumn: 1}}, h(Tabs, {
          tabs: {
            [COPY.artifactsTab]: props.artifacts.text ? h(Text, {source: props.artifacts.text}) : null,
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
      inCohort || isFacilitator || cohort.completed ? null
        : h(Sidebar, {} ,h(Enroll, {course}, h(EnrollInCohort, {id: props.cohort.id, course: props.course.id})))
    ])
  ])
}

let LearnerEntry = styled('div')`
display: grid;
grid-template-columns: max-content min-content;
grid-gap: 16px;
`

const EnrollInCohort = (props:{id:number, course: number}) => {
    let {data: user} = useUserData()
    let stripe = useStripe()
    let router = useRouter()
    let [status, callEnroll] = useApi<null, EnrollResponse>([stripe], async (res)=>{
        if(res.zeroCost) await router.push('/courses/[slug]/[id]/cohorts/[cohortId]', `/courses/${router.query.slug}/${props.course}/${props.id}?welcome`)
        else await stripe?.redirectToCheckout({sessionId: res.sessionId})
    })

  let onClick= async (e:React.MouseEvent)=> {
    e.preventDefault()
    if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!props.id) return
    if(!stripe) return
    await callEnroll(`/api/cohorts/${props.id}/enroll`)
  }

  return  h(Primary, {onClick, status}, 'Join this Cohort')
}

const MarkCohortLive = (props:{cohort:Cohort, mutate:(c:Cohort)=>void})=> {
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
            setState('loading')
            let res = await callApi<UpdateCohortMsg, UpdateCohortResponse>(`/api/cohorts/${props.cohort.id}`, {data: {live: true}})
            if(res.status === 200) props.mutate({...props.cohort, live: res.result.live})
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

const MarkCohortComplete = (props:{cohort:Cohort, mutate:(c:Cohort)=>void})=> {
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
            setState('loading')
            let res = await callApi<UpdateCohortMsg, UpdateCohortResponse>(`/api/courses/${props.cohort.courses.id}/cohorts/${props.cohort.id}`, {data:{completed:true}})
            if(res.status === 200) props.mutate({...props.cohort, completed: res.result.completed})
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

const WelcomeModal = (props: {display:boolean, cohort:Cohort}) => {
  return h(Modal, {display:props.display}, [
    h(Box, {gap: 32}, [
      h('h2', "You're enrolled!"),
      h(Info, {}, h('b', `This cohort starts on ${prettyDate(props.cohort.start_date)}`)),
      h('p',
        `For now, you can head to the cohort form to introduce yourself see what you
you'll be doing on your first day`),
      h('a', {
        style: {margin: 'auto'},
        href: `https://forum.hyperlink.academy/session/sso?return_path=/c/${props.cohort.category_id}`
      }, h(Primary, "Get started")),
      h(Link, {
        href:'/courses/[slug/]/[id]/cohorts/[cohortId]',
        as: `/courses/${props.cohort.courses.slug}/${props.cohort.courses.id}/cohorts/${props.cohort.id}`
      }, h('a', 'Back to the cohort page'))
    ])
  ])
}

const Banners = (props:{
  cohort: Cohort
  mutate: (c:Cohort)=>void
  facilitating?: boolean,
  enrolled?: boolean,
})=>{
  let isStarted = (new Date(props.cohort.start_date)).getTime() - (new Date()).getTime()
  let forum = `https://forum.hyperlink.academy/session/sso?return_path=/c/${props.cohort.category_id}`

  if(props.facilitating && !props.cohort.live) return h(TwoColumnBanner, {red: true}, h(Box, {gap:16}, [
    h(Box, {gap: 8, className: "textSecondary"}, [
      h('h4', `This cohort isn't live yet!`),
      h('p', `This cohort is hidden from public view. You can make edits to the cohort forum and the topics within.`),
      h('p', `When you're ready click the button below to put the cohort live on the site`),
    ]),
    h(MarkCohortLive, {cohort:props.cohort, mutate: props.mutate})
  ]))

  if(props.cohort.completed && props.enrolled)  return h(TwoColumnBanner, [
    h(Box, {gap: 8, className: "textSecondary"}, [
      h('h4', `You completed this course on ${prettyDate(props.cohort.completed || '')}!`),
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
  let courseId = parseInt(ctx.params?.id as string || '' )
  if(Number.isNaN(courseId)) return {props: {notFound: true}} as const

  let course = await courseDataQuery(courseId)
  if(!course) return {props: {notFound: true}} as const

  let cohortId = parseInt(ctx.params?.cohortId as string || '')
  if(Number.isNaN(cohortId)) return {props:{notFound: true}} as const
  let cohort = await cohortDataQuery(cohortId)

  if(!cohort) return {props: {notFound: true}} as const

  let notes = await getTaggedPost(cohort.category_id, 'note')
  let artifacts = await getTaggedPost(cohort.category_id, 'artifact')
  let curriculum = await getTaggedPost(cohort.courses.category_id, 'curriculum')
  return {props: {notFound: false, courseId, cohortId, cohort, course, notes, curriculum, artifacts}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
