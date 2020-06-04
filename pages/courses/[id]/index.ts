import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { InferGetStaticPropsType } from 'next'

import { Box, Seperator, TwoColumn, Sidebar } from '../../../components/Layout'
import {Tabs} from '../../../components/Tabs'
import { colors } from '../../../components/Tokens'
import Loader from '../../../components/Loader'
import { Input, Label, Error, Info, Select, Textarea} from '../../../components/Form'
import {Pill} from '../../../components/Pill'
import Enroll from '../../../components/Course/Enroll'
import Text from '../../../components/Text'
import {SmallInstanceCard} from '../../../components/Card'

import { getTaggedPost } from '../../../src/discourse'
import { Primary, Destructive} from '../../../components/Button'
import { useUserData, useUserInstances, useCourseData, Course } from '../../../src/data'
import { courseDataQuery, CheckUsernameResult } from '../../api/get/[...item]'
import { CreateInstanceMsg, CreateInstanceResponse, UpdateCourseMsg, UpdateCourseResponse, InviteToCourseMsg, InviteToCourseResponse} from '../../api/courses/[action]'
import { callApi, useApi } from '../../../src/apiHelpers'
import { instancePrettyDate } from '../../../components/Card'
import ErrorPage from '../../404'
import { useDebouncedEffect } from '../../../src/hooks'

export const COPY = {
  courseForum: "Check out the course forum",
  curriculumTab: "Curriculum",
  cohortTab: "Past Cohorts",
  activeCohorts: "You Current Cohorts",
  settingsTab: "Settings",
  inviteOnly: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested!"),
  invited: h('span.accentSuccess', "You're invited!"),
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
  let {data:userInstances} = useUserInstances()
  let {data: course, mutate} = useCourseData(props.id, props.course || undefined)
  let router = useRouter()

  if(!course) return null

  let activeCohorts = course?.course_instances.filter(i => {
    if(!user) return false
    return i.facillitator === user.id
      || i.people_in_instances
      .find(p => p.people.id === (user ? user.id : undefined)) && i.completed === null
  }) || []

  let pastCohorts = course.course_instances
    .filter(c=>c.completed)
    .map(i=>{
      if(!user) return i
      let enrolled = i.people_in_instances.find(p => p.people.id === (user ? user.id : undefined))
      let facilitating = i.facillitator === user.id
      return {...i, enrolled, facilitating}
    })

  let isMaintainer = !!(course?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  let invited = !!userInstances?.invited_courses.find(course=>course.id === props.course.id )

  //Setting up the layout for the course page
  return h(TwoColumn, {}, [
    h(Box, {gap: 32}, [
      h(Box, {gap: 16}, [
        h('h1', course?.name),
        h('span', {style:{color: 'blue'}}, [h('a.mono',{href:`https://forum.hyperlink.academy/c/${course?.id}`},  COPY.courseForum), ' ➭'])
      ]),
      course?.description || '',
      activeCohorts.length > 0 ? h(Box, {padding: 32, style: {backgroundColor: colors.grey95}}, [
          h('h3', COPY.activeCohorts),
          ...activeCohorts.map(instance=> h(SmallInstanceCard, {
            ...instance,
            facillitating: instance.facillitator === (user ? user?.id : undefined),
            enrolled: !(instance.facillitator === (user ? user?.id : undefined))
          }))
      ]) : null
    ]),
    h(Tabs, {tabs: {
      [COPY.curriculumTab]:  h(Box, [
        isMaintainer ? h(COPY.updateCurriculum, {id: props.content.id}) : null,
        h(Text, {source: props.content.text})
      ]),
      [COPY.cohortTab]:  (pastCohorts.length > 0) ? h(Cohorts,{cohorts: pastCohorts}) : null,
      [COPY.settingsTab]: isMaintainer ? h(Settings, {inviteOnly:course?.invite_only, courseId: props.id, mutate}) : null
    }}),
    h(Sidebar, [
      h(Enroll, {course}, [
        h(Box, {gap: 8}, [
          h(Primary, {
            onClick: ()=> router.push('/courses/[id]/enroll', `/courses/${props.course?.id}/enroll`),
            disabled: !invited
          }, 'Enroll in this Course'),
          h('div.textSecondary', {style:{width:232}}, [
          course?.invite_only && !invited ? COPY.inviteOnly : null,
          course?.invite_only && invited ? COPY.invited : null
          ])
        ])
      ])]),
  ])
}

const Cohorts = (props:{cohorts: Course['course_instances'] & {facilitating?: boolean, enrolled?: boolean}}) => {
  return h(Box, {gap:32}, [
    h('h2', 'Past Cohorts'),
    ...props.cohorts
      .filter(i => i.completed)
      .sort((a, b) => new Date(a.start_date) > new Date(b.start_date) ? 1 : -1)
      .map(instance => h(Instance, {instance}))
    ])
}

const Instance = (props: {instance: Course['course_instances'][0] & {facilitating?: boolean, enrolled?: boolean}}) => {
  let id= props.instance.id.split('-').slice(-1)[0]

  return h(Box, {gap: 16}, [
    h(Box, {gap: 8}, [
      !props.instance.enrolled && !props.instance.facilitating ? null : h('div', [
        props.instance.enrolled ? h(Pill, 'enrolled') : null,
        ' ',
        props.instance.facilitating ? h(Pill, {borderOnly: true}, 'facillitating') : null,
      ]),
      h('h3', {}, h(Link, {
        href:'/courses/[id]/[instanceID]',
        as:  `/courses/${props.instance.course}/${props.instance.id}`
      }, h('a', {style: {textDecoration: 'none'}}, `#${id} ${props.instance.courses.name}`))),
    ]),
    h(Box, {style: {color: colors.textSecondary}, gap: 4}, [
      h('strong', instancePrettyDate(props.instance.start_date, props.instance.completed)),
      h('div', `Facillitated by ${props.instance.people.display_name}`)
    ])
  ])
}

const Settings = (props: {inviteOnly?: boolean, mutate: (course:Course)=> any, courseId:string}) => {
  return h(Box, {gap: 64}, [
    h(Box, {style: {width:400}}, [
      h('div', [
        `To add a new maintainer or remove an instance please email `,
        h('a',{href:'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy'),
      ]),
      h(Seperator),
    ]),
    h(AddInstance),
    h(EditDetails),
    props.inviteOnly ? h(InvitePerson, {id: props.courseId}) : null
  ])
}

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

const AddInstance = ()=> {
  let [newInstance, setNewInstance] = useState({start: '', facillitator: ''})
  let [status, callCreateInstance] = useApi<CreateInstanceMsg, CreateInstanceResponse>([newInstance])
  let router = useRouter()
  let {data:courseData, mutate} = useCourseData(router.query.id as string)

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    let res = await callCreateInstance('/api/courses/createInstance', {courseId: courseData.id, ...newInstance})
    if(res.status === 200) mutate({
        ...courseData,
        course_instances: [...courseData.course_instances, {...res.result, people_in_instances:[], courses: {name: courseData.name}}]
      })
  }

  return h('form', {onSubmit}, [
    h(Box, {gap: 32, style: {width: 400}}, [
      h('h2', 'Add a new Instance'),
      status === 'error' ? h(Error, 'An error occured') : null,
      status === 'success' ? h(Info, 'Instance created!') : null,
      h(Label, [
        h(Select, {
          required: true,
          onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewInstance({...newInstance, facillitator: e.currentTarget.value})
        }, [
          h('option', {value: ''}, "Select a facillitator"),
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
          value: newInstance.start,
          onChange: e => setNewInstance({...newInstance, start: e.currentTarget.value})
        })
      ]),
      h(Primary, {
        type: 'submit',
        disabled: !newInstance.start || !newInstance.facillitator
      }, status === 'loading' ? h(Loader) : 'Add a new Instance'),
      h(Seperator),
    ])
  ])
}

// Feature to edit course detail (length, prereqs, one line description)
const EditDetails = ()=> {
  let [formData, setFormData] = useState({
    duration: '',
    prerequisites: '',
    description: ''
  })
  let [status, callUpdateCourse] = useApi<UpdateCourseMsg, UpdateCourseResponse>([])
  let router = useRouter()
  let courseId = router.query.id as string
  let {data:course, mutate} = useCourseData(courseId)

  useEffect(()=>{
    if(course) setFormData({
      duration: course.duration,
      prerequisites: course.prerequisites,
      description: course.description
    })
  }, [course])

  let changed = course && (course.duration !== formData.duration
                           || course.prerequisites !== formData.prerequisites
                           || course.description !== formData.description)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let res = await callUpdateCourse('/api/courses/updateCourse', {...formData, id:courseId})
    if(res.status === 200 && course) mutate({...course, ...res.result})
  }

  return h('form', {onSubmit}, [
    h(Box, {gap:32, style:{width: 400}}, [
      h('h3', 'Edit Course Details'),
      h(Box, {gap:8}, [h('b', 'Course Name'),h(Info, course?.name)]),
      h(Box, {gap:8}, [h('b', 'Course Cost'),h(Info, course?.cost ? `$${course.cost}` : null)]),
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
          if(course)setFormData({
            prerequisites: course.prerequisites,
            duration: course.duration,
            description: course.description
          })
        }}, "Discard Changes"),
        h(Primary, {type: 'submit', disabled: !changed},
          status === 'loading' ? h(Loader) : 'Save Changes')
      ])
    ])
  ])
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
