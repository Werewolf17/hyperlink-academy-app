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
import { Info, Error, Select, Input, Textarea, CheckBox } from 'components/Form'
import { Primary, Destructive, Secondary, BackButton } from 'components/Button'
import ErrorPage from 'pages/404'
import { useDebouncedEffect } from 'src/hooks'
import { courseDataQuery, UpdateCourseMsg, UpdateCourseResponse } from 'pages/api/courses/[id]'
import { CheckUsernameResult } from 'pages/api/get/[...item]'
import { CreateCohortMsg, CreateCohortResponse } from 'pages/api/cohorts'
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
      h(BackButton, {href: "/courses/[slug]/[id]", as: `/courses/${router.query.slug}/${router.query.id}`}, 'Course Details'),
      h('h1', "Course Settings"),
      h('p.big', [
        `Hyperlink is new and some things can only be done manually for now! To add a new maintainer, remove a cohort, or anything else you don't see here, please email `,
        h('a', {href: 'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy')]),
      h('p.big', "Changes will only apply to future cohorts, not existing ones.")
    ]),
    h(Tabs, { tabs: {
      Cohorts: h(CohortSettings, {course, mutate}),
      Details: h(EditDetails, {course, mutate}),
      Invites: h(Invites, {course, mutate}),
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
    let res = await callCreateCohort(`/api/cohorts`, {courseId: props.course.id, ...newCohort})
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

const Invites = (props:{course:Course, mutate: (c:Course) => void})=> {
  let [emailOrUsername, setEmailOrUsername] = useState('')
  let [invite_only, setInviteOnly] = useState(props.course.invite_only)
  let [valid, setValid] = useState<null | boolean>(null)
  let [status, callInviteToCourse] = useApi<InviteToCourseMsg, InviteToCourseResponse>([emailOrUsername], ()=>setEmailOrUsername(''))
  let [updateStatus, callUpdateCourse] = useApi<UpdateCourseMsg, UpdateCourseResponse>([])

  useDebouncedEffect(async ()=>{
    if(emailOrUsername.includes('@') || emailOrUsername === '') return setValid(null)
    let res = await callApi<null, CheckUsernameResult>('/api/get/username/'+emailOrUsername)
    if(res.status===404) setValid(false)
    else setValid(true)
  }, 500, [emailOrUsername])
  useEffect(()=>setValid(null),[emailOrUsername])

  let onSubmitInvite = async (e: React.FormEvent)=>{
    e.preventDefault()
    let x = emailOrUsername.includes('@') ? {email: emailOrUsername} : {username: emailOrUsername}
    callInviteToCourse(`/api/courses/${props.course.id}/invite`, {...x})
  }

  let onSubmitToggleInviteOnly = async (e:React.FormEvent)=>{
    e.preventDefault()
    let res = await callUpdateCourse(`/api/courses/${props.course.id}`, {invite_only})
    if(res.status === 200) props.mutate({...props.course, ...res.result})
  }

  return h(Box, {gap: 16, width: 400}, [
    h('h1', "Invites"),
    h(Box, {gap:32}, [
      h(FormBox, {onSubmit: onSubmitToggleInviteOnly}, [
        h(LabelBox, { gap:8, width: 400}, [
          h('div', [
            h('h4', "Invite Only"),
            h('small.textSecondary', `Learners cannot enroll in an invite only course unless you have sent them an
invite. The invite allows them enroll in any cohort and does not expire.`)
          ]),
          h(CheckBox, [
            h(Input, {
              type: 'checkbox',
              checked: invite_only,
              onChange: e => setInviteOnly(e.currentTarget.checked)
            }),
            "Make this course invite only"
          ])
        ]),
        h(Primary, {
          style: {justifySelf: 'right'},
          status: updateStatus,
          type: 'submit',
          disabled: props.course.invite_only === invite_only
        }, "Change"),
      ]),
      !props.course.invite_only ? null : h(FormBox, {onSubmit: onSubmitInvite, gap:32, width: 400}, [
        h(LabelBox, {gap:8}, [
          h('h4', "Invite someone to enroll"),
          h('small.textSecondary', `Invite someone with their username or email. Invitee does not need a Hyperlink account to be invited, but they will need an account to enroll.`),
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
    ])
  ])
}

const EditDetails = (props: {course: Course, mutate:(course:Course)=>void}) => {
  let [formData, setFormData] = useState({
    name: props.course.name,
    cohort_max_size: props.course.cohort_max_size,
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
    || props.course.cohort_max_size !== formData.cohort_max_size
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let res = await callUpdateCourse(`/api/courses/${props.course.id}`, {...formData})
    if(res.status === 200) props.mutate({...props.course, ...res.result})
  }

  return h(FormBox, {onSubmit, gap:32, style:{width: 400}}, [
    h('h2', 'Edit Course Details'),
    h(LabelBox, {gap:8}, [
      h('h4', 'Name'),
      h(Box, {gap: 4}, [
        h(Input, {
          type: 'text',
          maxLength: 50,
          value: formData.name,
          onChange: e => setFormData({...formData, name: e.currentTarget.value})
        }),
        h('small.textSecondary', {style:{justifySelf: 'right'}}, `${formData.name.length}/50`)
      ])
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
      h('div', [
        h('h4', "Cohort Size"),
        h('small.textSecondary', "How many learners can enroll in a cohort. Set to 0 for no limit.")
      ]),
      h(Input, {
        type: 'number',
        required: true,
        value: formData.cohort_max_size,
        onChange: (e)=> setFormData({...formData, cohort_max_size: parseInt(e.currentTarget.value)})
      })
    ]),
    h(LabelBox, {gap:8}, [
      h('h4', 'Description'),
      h(Box, {gap: 4}, [
        h(Textarea, {
          maxLength: 200,
          value: formData.description,
          onChange: e => setFormData({...formData, description: e.currentTarget.value})
        }),
        h('small.textSecondary', {style:{justifySelf: 'right'}}, `${formData.description.length}/200`)
      ])
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
      h('p', `Each cohort comes with its own community space, and templates to help you populate its structure with topics.`),
      h('ul', {style: {'margin': 'auto 0'}}, [
        h('li', [
          h('b', 'Prepopulated'), 
          h('span', ' topics are automatically posted when each new cohort is created')
        ]),
        h('li', [
          h('b', 'Triggered'), 
          h('span', ' topics can be posted by the facilitator from the cohort settings (editable before publishing, so useful for creating multiple topics from one template)')
        ])
      ]),
      h('p', `You can edit the default templates we've provided below, or add new ones!`),
      h(Link, {
        href: '/courses/[slug]/[id]/settings/templates/[templateId]',
        as:`/courses/{props.course.slug}/${props.course.id}/settings/templates/new`
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
                href: '/courses/[slug]/[id]/settings/templates/[templateId]',
                as: `/courses/${props.course.slug}/${props.course.id}/settings/templates/${template.name}`
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
  let id = parseInt(ctx.params?.id as string || '' )
  if(Number.isNaN(id)) return {props: {notFound: true}} as const

  let data = await courseDataQuery(id)
  if(!data) return {props:{notFound: true}} as const

  return {props: {notFound: false, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
