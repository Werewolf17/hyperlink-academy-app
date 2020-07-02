import h from 'react-hyperscript'
import { Tabs } from '../../../components/Tabs'
import { useState, useEffect } from 'react'
import { useApi, callApi } from '../../../src/apiHelpers'
import { CreateCohortResponse, CreateCohortMsg, UpdateCourseMsg, UpdateCourseResponse, InviteToCourseMsg, InviteToCourseResponse } from '../../api/courses/[action]'
import { courseDataQuery, CheckUsernameResult } from '../../api/get/[...item]'
import ErrorPage from '../../404'
import { InferGetStaticPropsType } from 'next'
import { Course, useCourseData } from '../../../src/data'
import Loader, { PageLoader } from '../../../components/Loader'
import { Box, Seperator } from '../../../components/Layout'
import { Info, Error, Label, Select, Input, Textarea } from '../../../components/Form'
import { Primary, Destructive } from '../../../components/Button'
import styled from '@emotion/styled'
import { useDebouncedEffect } from '../../../src/hooks'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Checkmark } from '../../../components/Icons'

const COPY = {
  backToCourse: 'back to the course',
  cancelCohort: h('p.textSecondary', [
    `Contact us at `, h('a', {href:'mailto:contact@hyperlink.academy'}, `contact@hyperlink.academy`), ` to cancel a cohort. Optionally,  let us know the reason you’re cancelling (we’re curious 🤓)`,
  ])
}

type Props = InferGetStaticPropsType<typeof getStaticProps>
const WrappedCourseSettingsPage = (props: Props)=>props.notFound ? h(ErrorPage) : h(CourseSettings, props)
function CourseSettings(props:Extract<Props, {notFound:false}>){
  let {data: course, mutate} = useCourseData(props.id, props.course || undefined)
  let router = useRouter()
  if(!course) return h(PageLoader)

  return h(Box, {gap:64, width: 640}, [
    h(Box, {gap: 16}, [
      h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', COPY.backToCourse))]),
      h('h1', "Course Settings"),
      h('p',[
        `We're still new and adding maintainer features! If you'd like to add a new
maintainer, remove an cohort, or anything else, please email `,
        h('a', {href: 'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy')]),
    ]),
    h(Tabs, { tabs: {
      Cohorts: h(CohortSettings, {course, mutate}),
      Details: h(EditDetails, {course, mutate}),
      Invites: course.invite_only ? h(InvitePerson, {id: course.id}) : null,
    } })
  ])
}

export default WrappedCourseSettingsPage

function CohortSettings(props:{course:Course, mutate: (course:Course)=>void}) {
  return h(Box, {gap: 32}, [
    h(AddCohort, props),
    h(Seperator),
    h(Box, {gap: 16}, [
      h('h3', "Cancel a Cohort"),
      COPY.cancelCohort
    ])
  ])
}

//feature to add a new cohort to a course
const AddCohort = (props:{course:Course, mutate:(c:Course)=>void})=> {
  let [newCohort, setNewCohort] = useState({start: '', facilitator: ''})
  let [status, callCreateCohort] = useApi<CreateCohortMsg, CreateCohortResponse>([newCohort])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    let res = await callCreateCohort('/api/courses/createCohort', {courseId: props.course.id, ...newCohort})
    if(res.status === 200) props.mutate({
        ...props.course,
        course_cohorts: [...props.course.course_cohorts, {...res.result, people_in_cohorts:[], courses: {name: props.course.name}}]
      })
  }

  let ButtonState = {
    normal:  'Add a new Cohort',
    loading: h(Loader),
    error: 'An error occured!',
    success: Checkmark
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
          ...(props.course.course_maintainers.map(maintainer => {
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
        style: {justifySelf: 'right'},
        type: 'submit',
        success: status === 'success',
        disabled: !newCohort.start || !newCohort.facilitator
      }, ButtonState[status]),
    ])
  ])
}

const InvitePerson = (props:{id: string})=> {
  let [emailOrUsername, setEmailOrUsername] = useState('')
  let [valid, setValid] = useState<null | boolean>(null)
  let [status, callInviteToCourse] = useApi<InviteToCourseMsg, InviteToCourseResponse>([emailOrUsername], ()=>setEmailOrUsername(''))

  const ButtonState = {
    normal: "Invite",
    loading: h(Loader),
    success: Checkmark,
    error: "An error occured!"
  }

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
    }, ButtonState[status]),
  ]))
}

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
      h('h2', 'Edit Course Details'),
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

  return {props: {notFound: false, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
