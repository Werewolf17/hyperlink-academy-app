import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { InferGetStaticPropsType } from 'next'

import { Box, Seperator, TwoColumn, Sidebar } from '../../../components/Layout'
import {Tabs} from '../../../components/Tabs'
import { colors } from '../../../components/Tokens'
import Loader, { PageLoader } from '../../../components/Loader'
import { Input, Label, Error, Info, Select, Textarea} from '../../../components/Form'
import {Pill} from '../../../components/Pill'
import Enroll from '../../../components/Course/Enroll'
import Text from '../../../components/Text'
import {SmallCohortCard} from '../../../components/Card'
import {TwoColumnBanner} from '../../../components/Banner'
import {Modal} from '../../../components/Modal'
import { Primary, Destructive, Secondary} from '../../../components/Button'

import { getTaggedPost } from '../../../src/discourse'
import { useUserData, useUserCohorts, useCourseData, Course } from '../../../src/data'
import { courseDataQuery, CheckUsernameResult } from '../../api/get/[...item]'
import { CreateCohortMsg, CreateCohortResponse,
         UpdateCourseMsg, UpdateCourseResponse,
         InviteToCourseMsg, InviteToCourseResponse,
         MarkCourseLiveMsg, MarkCourseLiveResponse} from '../../api/courses/[action]'
import { callApi, useApi } from '../../../src/apiHelpers'
import { cohortPrettyDate } from '../../../components/Card'
import ErrorPage from '../../404'
import { useDebouncedEffect } from '../../../src/hooks'

export const COPY = {
  courseForum: "Check out the course forum",
  curriculumTab: "Curriculum",
  cohortTab: "Past Cohorts",
  activeCohorts: "Your Current Cohorts",
  settingsTab: "Settings",
  inviteOnly: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested!"),
  inviteOnlyLoggedOut: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested! If you've been invited, please log in."),
  invited: h('span.accentSuccess', "You're invited!"),
  noUpcoming: h('span.accentRed', "Looks like there aren't any cohorts of this course planned :("),
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
  let {data: course, mutate} = useCourseData(props.id, props.course || undefined)

  if(!course) return h(PageLoader)

  let activeCohorts = course?.course_cohorts.filter(i => {
    if(!user) return false
    return i.facilitator === user.id
      || i.people_in_cohorts
      .find(p => p.people.id === (user ? user.id : undefined)) && i.completed === null
  }) || []

  let pastCohorts = course.course_cohorts
    .filter(c=>c.completed)
    .map(i=>{
      if(!user) return i
      let enrolled = i.people_in_cohorts.find(p => p.people.id === (user ? user.id : undefined))
      let facilitating = i.facilitator=== user.id
      return {...i, enrolled, facilitating}
    })

  let enrolled = activeCohorts.filter(i=>i.facilitator !== (user ? user.id : ''))
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
        [COPY.settingsTab]: isMaintainer ? h(Settings, {course, mutate}) : null
      }}),
      h(Sidebar, [
        h(Enroll, {course}, [
          h(Box, {gap: 8}, [
            h(Link, {href: '/courses/[id]/enroll', as:`/courses/${props.course?.id}/enroll` }, [
              h('a', [
                h(Primary, {
                  disabled: !invited
                }, COPY.enrollButton),
              ])
            ]),
            h('div.textSecondary', {style:{width:232}}, [
              h(Box, {gap:16}, [
                upcomingCohorts.length === 0 ? COPY.noUpcoming : null,
                enrolled ? COPY.enrolled :
                  course?.invite_only && !invited ? (user ? COPY.inviteOnly : COPY.inviteOnlyLoggedOut) : null,
              ]),
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
        href:'/courses/[id]/[cohortId]',
        as:  `/courses/${props.cohort.course}/${props.cohort.id}`
      }, h('a', {style: {textDecoration: 'none'}}, `#${id} ${props.cohort.courses.name}`))),
    ]),
    h(Box, {style: {color: colors.textSecondary}, gap: 4}, [
      h('strong', cohortPrettyDate(props.cohort.start_date, props.cohort.completed)),
      h('div', `Facilitated by ${props.cohort.people.display_name}`)
    ])
  ])
}

const Settings = (props: {course:Course, mutate: (course:Course)=> any}) => {
  return h(Box, {gap: 64}, [
    h(Box, {style: {width:400}}, [
      h('div', [
        `To add a new maintainer or remove an cohort please email `,
        h('a',{href:'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy'),
      ]),
      h(Seperator),
    ]),
    props.course.invite_only ? h(InvitePerson, {id: props.course.id}) : null,
    h(AddCohort),
    h(EditDetails, props)
  ])
}

//Features for invite only courses
const InvitePerson = (props:{id: string})=> {
  let [emailOrUsername, setEmailOrUsername] = useState('')
  let [valid, setValid] = useState<null | boolean>(null)
  let [formState, callInviteToCourse] = useApi<InviteToCourseMsg, InviteToCourseResponse>([emailOrUsername])

  useDebouncedEffect(async ()=>{
    if(emailOrUsername.includes('@') || emailOrUsername === '') return setValid(null)
    let res = await callApi<null, CheckUsernameResult>('/api/get/username/'+emailOrUsername)
    if(res.status===404) setValid(false)
    else setValid(true)
  }, 500, [emailOrUsername])
  useEffect(()=>setValid(null),[emailOrUsername])

  let onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()
    let x = emailOrUsername.includes('@') ? {email: emailOrUsername} : {username: emailOrUsername}
    callInviteToCourse(`/api/courses/inviteToCourse`, {course:props.id, ...x})
  }
  return h('form', {onSubmit}, h(Box, {gap:32, width: 400}, [
    h('h2', "Invite someone to this course"),
    h(Label, [
      "Username or Email",
      h(Input, {
        type: emailOrUsername.includes('@') ? 'email' : 'text',
        required: true,
        value: emailOrUsername,
        onChange: e=> setEmailOrUsername(e.currentTarget.value)
      }),
      valid === null ? null :
        valid ? h('span.accentSuccess', "Great, found @"+emailOrUsername): h('span.accentRed', "We can't find a user with that username")
    ]),
    h(Primary, {
      style: {justifySelf: 'right'},
      type: 'submit',
      disabled: (!emailOrUsername.includes('@') && valid !== true)
    }, formState === 'loading' ? h(Loader) : 'Invite'),
  ]))
}

//feature to add a new cohort to a course
const AddCohort = ()=> {
  let [newCohort, setNewCohort] = useState({start: '', facilitator: ''})
  let [status, callCreateCohort] = useApi<CreateCohortMsg, CreateCohortResponse>([newCohort])
  let router = useRouter()
  let {data:courseData, mutate} = useCourseData(router.query.id as string)

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    let res = await callCreateCohort('/api/courses/createCohort', {courseId: courseData.id, ...newCohort})
    if(res.status === 200) mutate({
        ...courseData,
        course_cohorts: [...courseData.course_cohorts, {...res.result, people_in_cohorts:[], courses: {name: courseData.name}}]
      })
  }

  return h('form', {onSubmit}, [
    h(Box, {gap: 32, style: {width: 400}}, [
      h('h2', 'Add a new Cohort'),
      status === 'error' ? h(Error, 'An error occured') : null,
      status === 'success' ? h(Info, 'Cohort created!') : null,
      h(Label, [
        h(Select, {
          required: true,
          onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewCohort({...newCohort, facilitator: e.currentTarget.value})
        }, [
          h('option', {value: ''}, "Select a facilitator"),
          ...(courseData?.course_maintainers.map(maintainer => {
            return h('option', {value: maintainer.maintainer}, maintainer.people.display_name)
          })||[])
        ]),
      ]),
      h(Label, [
        'Start Date',
        h(Input, {
          type: 'date',
          required: true,
          value: newCohort.start,
          onChange: e => setNewCohort({...newCohort, start: e.currentTarget.value})
        })
      ]),
      h(Primary, {
        type: 'submit',
        disabled: !newCohort.start || !newCohort.facilitator
      }, status === 'loading' ? h(Loader) : 'Add a new Cohort'),
      h(Seperator),
    ])
  ])
}

function MarkCourseLive(props: {id:string}) {
  let {data:course, mutate} = useCourseData(props.id)
  let [state, setState] = useState<'normal'|'confirm'|'loading'|'complete'>('normal')

  const onClick = async (e: React.MouseEvent)  =>{
    e.preventDefault()
    if(!course) return
    setState('loading')
    let res = await callApi<MarkCourseLiveMsg, MarkCourseLiveResponse>('/api/courses/markCourseLive', {id: props.id})
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
const EditDetails = (props: {course: Course, mutate:(course:Course)=>void}) => {
  let [formData, setFormData] = useState({
    name: props.course.name,
    description: props.course.description,
    prerequisites: props.course.prerequisites,
    cost: props.course.cost,
    duration: props.course.duration
  })
  let [status, callUpdateCourse] = useApi<UpdateCourseMsg, UpdateCourseResponse>([])

  useEffect(()=>setFormData(props.course), [props])

  let changed = props.course.duration !== formData.duration
    || props.course.cost !== formData.cost
    || props.course.prerequisites !== formData.prerequisites
    || props.course.description !== formData.description

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let res = await callUpdateCourse('/api/courses/updateCourse', {...formData, id:props.course.id})
    if(res.status === 200) props.mutate({...props.course, ...res.result})
  }

  return h('form', {onSubmit}, [
    h(Box, {gap:32, style:{width: 400}}, [
      h('h3', 'Edit Course Details'),
      h(Label, [
        'Name',
        h(Input, {
          type: 'text',
          value: formData.name,
          onChange: e => setFormData({...formData, name: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'Cost (USD)',
        h(Input, {
          type: 'number',
          value: formData.cost,
          onChange: e => setFormData({...formData, cost: parseInt(e.currentTarget.value)})
        })
      ]),
      h(Label, [
        'Description',
        h(Textarea, {
          value: formData.description,
          onChange: e => setFormData({...formData, description: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'Prerequisites',
        h(Textarea, {
          value: formData.prerequisites,
          onChange: e => setFormData({...formData, prerequisites: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'Duration',
        h(Input, {
          value: formData.duration,
          onChange: e => setFormData({...formData, duration: e.currentTarget.value})
        })
      ]),
      h(SubmitButtons, [
        h(Destructive, {disabled: !changed, onClick: (e)=>{
          e.preventDefault()
          setFormData(props.course)
        }}, "Discard Changes"),
        h(Primary, {type: 'submit', disabled: !changed},
          status === 'loading' ? h(Loader) : 'Save Changes')
      ])
    ])
  ])
}

const Banners = (props:{draft: boolean, id: string, isMaintainer: boolean}) => {
  if(props.draft && props.isMaintainer) {
    return h(TwoColumnBanner, {red: true}, h(Box, {gap:16},[
      h(Box, {gap:16}, [
        h('h3', "This course isn't live yet!"),
        h('p', `This course is currently hidden from public view. You can make edits and get set
up. You can read `),
        h(Link, {href: '/manual/courses'}, h('a', 'this section')),
        h('p', ' in the manual for some tips and help getting started')
      ]),
      h(MarkCourseLive, {id: props.id})
    ]))
  }
  return null
}

const SubmitButtons = styled('div')`
justify-self: right;
display: grid;
grid-template-columns: auto auto;
grid-gap: 16px;
`

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
