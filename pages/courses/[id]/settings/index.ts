import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect, Fragment } from 'react'
import { InferGetStaticPropsType } from 'next'
import styled from '@emotion/styled'

import { Tabs } from 'components/Tabs'
import { useApi, callApi } from 'src/apiHelpers'
import { Course, useCourseData, useUserData } from 'src/data'
import { PageLoader } from 'components/Loader'
import { Box, Seperator, LabelBox, FormBox } from 'components/Layout'
import { Info, Error, Select, Input, Textarea } from 'components/Form'
import { Primary, Destructive, Secondary, BackButton } from 'components/Button'
import ErrorPage from 'pages/404'
import { useDebouncedEffect } from 'src/hooks'
import { courseDataQuery, UpdateCourseMsg, UpdateCourseResponse } from 'pages/api/courses/[id]'
import { CheckUsernameResult } from 'pages/api/get/[...item]'
import { CreateCohortMsg, CreateCohortResponse } from 'pages/api/courses/[id]/cohorts'
import { InviteToCourseMsg, InviteToCourseResponse } from 'pages/api/courses/[id]/invite'
import { Modal } from 'components/Modal'
import { DeleteTemplateResult } from 'pages/api/courses/[id]/templates/[templateId]'

const COPY = {
  cancelCohort: h('p.textSecondary', [
    `Contact us at `, h('a', {href:'mailto:contact@hyperlink.academy'}, `contact@hyperlink.academy`), ` to cancel a cohort. Optionally,  let us know the reason you’re cancelling (we’re curious 🤓)`,
  ])
}

type Props = InferGetStaticPropsType<typeof getStaticProps>
const WrappedCourseSettingsPage = (props: Props)=>props.notFound ? h(ErrorPage) : h(CourseSettings, props)
function CourseSettings(props:Extract<Props, {notFound:false}>){
  let {data: course, mutate} = useCourseData(props.id, props.course || undefined)
  let {data: user} = useUserData()
  let router = useRouter()

  useEffect(()=>{
    if(user === undefined) return
    if(course) {
      let isMaintainer = !!(course.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
      if(!isMaintainer) router.push('/')
    }
  }, [user, course])
  if(!course || !user) return h(PageLoader)


  return h(Box, {gap:64, width: 640}, [
    h(Box, {gap: 16}, [
      h(BackButton, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, 'Course Details'),
      h('h1', "Course Settings"),
      h('p.big',[
        `We're still new and adding maintainer features! If you'd like to add a new maintainer, remove an cohort, or anything else, please email `,
        h('a', {href: 'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy')]),
    ]),
    h(Tabs, { tabs: {
      Cohorts: h(CohortSettings, {course, mutate}),
      Details: h(EditDetails, {course, mutate}),
      Invites: course.invite_only ? h(InvitePerson, {id: course.id}) : null,
      Templates: h(CourseTemplates, {course, mutate})
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
    let res = await callCreateCohort(`/api/courses/${props.course.id}/cohorts`, {courseId: props.course.id, ...newCohort})
    if(res.status === 200) props.mutate({
        ...props.course,
        course_cohorts: [...props.course.course_cohorts, {...res.result, people_in_cohorts:[], courses: {name: props.course.name}}]
      })
  }

  return h(FormBox, {onSubmit, gap: 32, style: {width: 400}}, [
    h('h2', 'Add a new Cohort'),
    status === 'error' ? h(Error, 'An error occured') : null,
    status === 'success' ? h(Info, 'Cohort created!') : null,
    h(LabelBox, {gap:8}, [
      h('h4', "Facilitator"),
      h(Select, {
        required: true,
        onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewCohort({...newCohort, facilitator: e.currentTarget.value})
      }, [
        h('option', {value: ''}, "Select a facilitator"),
        ...(props.course.course_maintainers.map(maintainer => {
          return h('option', {value: maintainer.maintainer}, maintainer.people.display_name || maintainer.people.username)
        })||[])
      ])
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Start Date'),
      h(Input, {
        type: 'date',
        required: true,
        value: newCohort.start,
        onChange: e => setNewCohort({...newCohort, start: e.currentTarget.value})
      })
    ]),
    h(Primary, {
      style: {justifySelf: 'right'},
      status,
      type: 'submit',
      success: status === 'success',
      disabled: !newCohort.start || !newCohort.facilitator
    }, 'Add a new Cohort'),
  ])
}

const InvitePerson = (props:{id: number})=> {
  let [emailOrUsername, setEmailOrUsername] = useState('')
  let [valid, setValid] = useState<null | boolean>(null)
  let [status, callInviteToCourse] = useApi<InviteToCourseMsg, InviteToCourseResponse>([emailOrUsername], ()=>setEmailOrUsername(''))

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
    callInviteToCourse(`/api/courses/${props.id}/invite`, {...x})
  }
  return h(FormBox, {onSubmit, gap:32, width: 400}, [
    h('h2', "Invite someone to this course"),
    h(LabelBox, {gap:8}, [
      h('h4', "Username or Email"),
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
      status,
      type: 'submit',
      disabled: (!emailOrUsername.includes('@') && valid !== true)
    }, "Invite"),
  ])
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
    || props.course.name !== formData.name
    || props.course.cost !== formData.cost
    || props.course.prerequisites !== formData.prerequisites
    || props.course.description !== formData.description

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let res = await callUpdateCourse(`/api/courses/${props.course.id}`, {...formData})
    if(res.status === 200) props.mutate({...props.course, ...res.result})
  }

  return h(FormBox, {onSubmit, gap:32, style:{width: 400}}, [
    h('h2', 'Edit Course Details'),
    h(LabelBox, {gap:8}, [
      h('h4', 'Name'),
      h(Input, {
        type: 'text',
        value: formData.name,
        onChange: e => setFormData({...formData, name: e.currentTarget.value})
      })
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Cost (USD)'),
      h(Input, {
        type: 'number',
        value: formData.cost,
        onChange: e => setFormData({...formData, cost: parseInt(e.currentTarget.value)})
      })
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Description'),
      h(Textarea, {
        value: formData.description,
        onChange: e => setFormData({...formData, description: e.currentTarget.value})
      })
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Prerequisites'),
      h(Textarea, {
        value: formData.prerequisites,
        onChange: e => setFormData({...formData, prerequisites: e.currentTarget.value})
      })
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Duration'),
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
        h(Primary, {type: 'submit', disabled: !changed, status}, 'Save Changes')
    ])
  ])
}

function CourseTemplates (props: {course: Course, mutate: (c:Course)=>void}) {
  return h(Box, {gap: 32}, [
    h(Box, [
      h('p', `To help facilitators get started every new cohort is created with a forum
pre-populated with topics.`),
      h('p', `You can tweak the ones we provided or add new ones here.`),
      h(Link, {
        href: '/courses/[id]/settings/templates/[templateId]',
        as:`/courses/${props.course.id}/settings/templates/new`
      }, h(Primary, "+ Add A New Template")),
    ]),
    h(Box, {}, props.course.course_templates
      .sort((a, b)=>  a.name > b.name ? 1 : -1)
      .sort((a)=> a.required ? -1 : 1)
      .flatMap(template => {
        return [
          h(Box, {h: true, style: {gridAutoColumns: 'auto'}},[
            h('div', [
              h('h3', template.name),
              h('span.textSecondary', template.type ==='prepopulated' ? "Prepopulated for all cohorts" : "Manually published by facilitator")
            ]),
            h(Box, {h: true, style:{justifySelf: 'end', alignItems: 'center'}}, [
              template.required ? null : h(DeleteTemplate, {course: props.course, mutate: props.mutate, templateName: template.name}),
              h(Link, {
                href: '/courses/[id]/settings/templates/[templateId]',
                as: `/courses/${props.course.id}/settings/templates/${template.name}`
              }, h(Secondary, 'Edit'))
            ])
          ]),
          h(Seperator)
        ]}).slice(0, -1))
  ])
}

function DeleteTemplate(props:{templateName:string, course:Course, mutate:(c:Course)=>void}) {
  let [state, setState] = useState<'normal' | 'confirm'>('normal')
  let [status, callDelete] = useApi<null, DeleteTemplateResult>([props])
  return h(Fragment, [
    h(Destructive, {onClick: ()=>setState('confirm')}, 'Delete'),
    h(Modal, {display: state !== 'normal', onExit: ()=>setState('normal')}, [
      h(Box, {style: {textAlign: 'center'}}, [
        h('h3', "Are you sure?"),
        h(Primary, {status, onClick:async ()=>{
          let res = await callDelete(`/api/courses/${props.course.id}/templates/${props.templateName}`, null, "DELETE")
          if(res.status ===200) {
            props.mutate({
              ...props.course,
              course_templates: props.course.course_templates
                .filter(t=>t.name!==props.templateName)
            })
            setState('normal')
          }
        }}, "Yup delete it"),
        h(Secondary, {onClick: ()=>setState('normal')}, 'Nope, nevermind')
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
  let id = parseInt((ctx.params?.id as string || '' ).split('-').slice(-1)[0])
  if(Number.isNaN(id)) return {props: {notFound: true}} as const

  let data = await courseDataQuery(id)
  if(!data) return {props:{notFound: true}} as const

  return {props: {notFound: false, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
