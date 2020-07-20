import h from 'react-hyperscript'
import { useState } from 'react'
import Link from 'next/link'
import { InferGetStaticPropsType } from 'next'

import { Box, Seperator, TwoColumn, Sidebar } from '../../../components/Layout'
import {Tabs} from '../../../components/Tabs'
import { colors } from '../../../components/Tokens'
import Loader, { PageLoader } from '../../../components/Loader'
import { Info} from '../../../components/Form'
import {Pill} from '../../../components/Pill'
import Enroll from '../../../components/Course/Enroll'
import Text from '../../../components/Text'
import {SmallCohortCard} from '../../../components/Card'
import {TwoColumnBanner} from '../../../components/Banner'
import {Modal} from '../../../components/Modal'
import { Primary, Destructive, Secondary} from '../../../components/Button'

import { getTaggedPost } from '../../../src/discourse'
import { useUserData, useUserCohorts, useCourseData, Course } from '../../../src/data'
import { UpdateCourseMsg, UpdateCourseResponse} from '../../api/courses/[id]'
import { callApi } from '../../../src/apiHelpers'
import { cohortPrettyDate } from '../../../components/Card'
import ErrorPage from '../../404'
import { courseDataQuery } from '../../api/courses/[id]'

const COPY = {
  courseForum: "Check out the course forum",
  curriculumTab: "Curriculum",
  cohortTab: "Past Cohorts",
  activeCohorts: "Your Current Cohorts",
  settings: "You can edit course details, create new cohorts, and more.",
  inviteOnly: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested!"),
  inviteOnlyLoggedOut: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested! If you've been invited, please log in."),
  invited: h('span.accentSuccess', "You're invited!"),
  noUpcoming: h('span.accentRed', "Looks like there aren't any cohorts of this course planned :("),
  noUpcomingMaintainer: (props:{courseId:string})=> h('span.accentRed', [
    "Looks like there aren't any cohorts of this course planned, maybe ", h(Link, {href: "/courses/[id]/settings", as: `/courses/${props.courseId}/settings`}, h('a', 'create one'))
  ]),
  enrolled: h('span.accentSuccess', "You're enrolled in an upcoming cohort of this course. Feel free to enroll in another one though!"),
  enrollButton: "See Upcoming Cohorts",

  updateCurriculum: (props: {id: string}) => h(Info, [
    `💡 You can make changes to the curriculum by editing `,
    h('a', {href: `https://forum.hyperlink.academy/t/${props.id}`}, `this topic`),
    ` in the forum`
  ])
}

type Props = InferGetStaticPropsType<typeof getStaticProps>

const WrappedCoursePage = (props: Props)=>props.notFound ? h(ErrorPage) : h(CoursePage, props)
export default WrappedCoursePage

const CoursePage = (props:Extract<Props, {notFound: false}>) => {
  let {data: user} = useUserData()
  let {data:userCohorts} = useUserCohorts()
  let {data: course} = useCourseData(props.id, props.course || undefined)

  if(!course) return h(PageLoader)

  let activeCohorts = course?.course_cohorts.filter(i => {
    if(!user) return false
    return i.completed === null && (i.facilitator === user.id
      || i.people_in_cohorts
        .find(p => p.people.id === (user ? user.id : undefined)))
  }) || []

  let pastCohorts = course.course_cohorts
    .filter(c=>c.completed)
    .map(i=>{
      if(!user) return i
      let enrolled = i.people_in_cohorts.find(p => p.people.id === (user ? user.id : undefined))
      let facilitating = i.facilitator=== user.id
      return {...i, enrolled, facilitating}
    })

  let enrolled = activeCohorts.filter(i=>i.facilitator !== (user ? user.id : '')).length > 0
  let upcomingCohorts = course.course_cohorts.filter(c=> (new Date(c.start_date) > new Date()) && c.live)

  let isMaintainer = !!(course?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  let invited = !!userCohorts?.invited_courses.find(course=>course.id === props.course.id )

  let forum = `https://forum.hyperlink.academy/${user ? 'session/sso?return_path=/':''}c/${course?.id}`

  //Setting up the layout for the course page
  return h('div', [
    h(Banners, {draft: course.status === 'draft', id: props.id, isMaintainer}),
    h(TwoColumn, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h('h1', course?.name),
          h('span', {style:{color: 'blue'}}, [h('a.mono',{href:forum},  COPY.courseForum), ' ➭'])
        ]),
        course?.description || '',
        activeCohorts.length > 0 ? h(Box, {padding: 32, style: {backgroundColor: colors.grey95}}, [
          h('h3', COPY.activeCohorts),
          ...activeCohorts.map(cohort=> h(SmallCohortCard, {
            ...cohort,
            facilitating: cohort.facilitator === (user ? user?.id : undefined),
            enrolled: !(cohort.facilitator === (user ? user?.id : undefined))
          }))
        ]) : null,
      ]),
      h(Tabs, {tabs: {
        [COPY.curriculumTab]:  h(Box, [
          isMaintainer ? h(COPY.updateCurriculum, {id: props.content.id}) : null,
          h(Text, {source: props.content.text})
        ]),
        [COPY.cohortTab]:  (pastCohorts.length > 0) ? h(Cohorts,{cohorts: pastCohorts}) : null,
      }}),
      h(Sidebar, [
        h(Enroll, {course}, [
          h(Box, {gap: 8}, [
            h(Link, {href: '/courses/[id]/cohorts', as:`/courses/${props.course?.id}/cohorts` }, [
              h('a', [
                h(Primary, {
                  disabled: upcomingCohorts.length === 0 || (course.invite_only && !invited)
                }, COPY.enrollButton),
              ])
            ]),
            h('div.textSecondary', {style:{width:232}}, [
              h(Box, {gap:16}, [
                upcomingCohorts.length === 0 ? isMaintainer ? h(COPY.noUpcomingMaintainer, {courseId: props.id}) : COPY.noUpcoming : null,
                enrolled ? COPY.enrolled :
                  course?.invite_only && !invited ? (user ? COPY.inviteOnly : COPY.inviteOnlyLoggedOut) : null,
              ]),
            ]),
            h(Seperator),
            !isMaintainer ? null : h(Box, [
              h('h3', "You maintain this course"),
              h('p.textSecondary', COPY.settings),
              h(Link, {href:'/courses/[id/settings', as:`/courses/${props.course.id}/settings`}, h(Destructive, 'Edit Course Settings'))
            ])
          ])
        ])]),
    ])
  ])
}

const Cohorts = (props:{cohorts: Course['course_cohorts'] & {facilitating?: boolean, enrolled?: boolean}}) => {
  return h(Box, {gap:32}, [
    h('h2', 'Past Cohorts'),
    ...props.cohorts
      .filter(i => i.completed)
      .sort((a, b) => new Date(a.start_date) > new Date(b.start_date) ? 1 : -1)
      .map(cohort => h(Cohort, {cohort}))
    ])
}

const Cohort = (props: {cohort: Course['course_cohorts'][0] & {facilitating?: boolean, enrolled?: boolean}}) => {
  let id= props.cohort.id.split('-').slice(-1)[0]

  return h(Box, {gap: 16}, [
    h(Box, {gap: 8}, [
      !props.cohort.enrolled && !props.cohort.facilitating ? null : h('div', [
        props.cohort.enrolled ? h(Pill, 'enrolled') : null,
        ' ',
        props.cohort.facilitating ? h(Pill, {borderOnly: true}, 'facilitating') : null,
      ]),
      h('h3', {}, h(Link, {
        href:'/courses/[id]/cohorts/[cohortId]',
        as:  `/courses/${props.cohort.course}/cohorts/${id}`
      }, h('a', {style: {textDecoration: 'none'}}, `#${id} ${props.cohort.courses.name}`))),
    ]),
    h(Box, {style: {color: colors.textSecondary}, gap: 4}, [
      h('strong', cohortPrettyDate(props.cohort.start_date, props.cohort.completed)),
      h('div', `Facilitated by ${props.cohort.people.display_name}`)
    ])
  ])
}
//feature to add a new cohort to a course
function MarkCourseLive(props: {id:string}) {
  let {data:course, mutate} = useCourseData(props.id)
  let [state, setState] = useState<'normal'|'confirm'|'loading'|'complete'>('normal')

  const onClick = async (e: React.MouseEvent)  =>{
    e.preventDefault()
    if(!course) return
    setState('loading')
    let res = await callApi<UpdateCourseMsg, UpdateCourseResponse>(`/api/courses/${props.id}`, {status: 'live'})
    if(res.status===200){
      setState('normal')
      mutate({...course, status: 'live'})
    }
  }

  if(state === 'confirm' || state === 'loading') return h(Modal, {display: true, onExit: ()=>setState('normal')},[
    h(Box, {gap: 32}, [
      h('h2', "Are you sure?"),
      h(Box, {gap: 16}, [
        "Before going live please check that you've done these things",
        h(Box.withComponent('ul'), {gap:16}, [
          h('li', "Written a curriculum"),
          h('li', "Filled out the getting started template for cohorts")
        ]),
        h(Box, {gap:16, style:{textAlign: 'right'}}, [
          h(Primary, {onClick}, state === 'loading' ? h(Loader) : 'Go Live!'),
          h(Secondary, {onClick: ()=> setState('normal')}, "Nevermind")
        ])
      ])
    ])
  ])

  return h(Destructive, {onClick: async e => {
    e.preventDefault()
    setState('confirm')
  }}, "I'm Ready. Go Live!")
}

// Feature to edit course detail (length, prereqs, one line description)
const Banners = (props:{draft: boolean, id: string, isMaintainer: boolean}) => {
  if(props.draft && props.isMaintainer) {
    return h(TwoColumnBanner, {red: true}, h(Box, {gap:16},[
      h(Box, {gap:16}, [
        h('h3', "This course isn't live yet!"),
        h('p',[
          `This course is currently hidden from public view. You can make edits and get set
up. You can read `,
          h(Link, {href: '/manual/courses'}, h('a', 'this section')),
          ' in the manual for some tips and help getting started'])
      ]),
      h(MarkCourseLive, {id: props.id})
    ]))
  }
  return null
}

export const getStaticProps = async (ctx:any) => {
  let id = (ctx.params?.id || '' )as string

  let data = await courseDataQuery(id)
  if(!data) return {props:{notFound: true}} as const
  let content = await getTaggedPost(id, 'curriculum')

  return {props: {notFound: false, content, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
