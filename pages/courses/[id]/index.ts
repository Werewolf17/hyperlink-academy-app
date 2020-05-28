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

import { getTaggedPostContent } from '../../../src/discourse'
import { Primary, Destructive} from '../../../components/Button'
import { useUserData, useUserInstances, useCourseData } from '../../../src/data'
import { courseDataQuery } from '../../api/get/[...item]'
import { CreateInstanceMsg, CreateInstanceResponse, UpdateCourseMsg, UpdateCourseResponse} from '../../api/courses/[action]'
import { callApi } from '../../../src/apiHelpers'
import { instancePrettyDate } from '../../../components/Card'
import ErrorPage from '../../404'

type Props = InferGetStaticPropsType<typeof getStaticProps>

export default (props: Props)=>props.notFound ? h(ErrorPage) : h(CoursePage, props)

const CoursePage = (props:Extract<Props, {notFound: false}>) => {
  let {data: user} = useUserData()
  let {data: course} = useCourseData(props.id, props.course || undefined)

  let userInstances = course?.course_instances.filter(i => {
    if(!user) return false
    return i.facillitator === user.id
      || i.people_in_instances
      .find(p => p.people.id === (user ? user.id : undefined))
  })
  if(userInstances?.length === 0) userInstances = undefined

  let isMaintainer = !!(course?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  return h(TwoColumn, {}, [
    h(Box, {gap: 32}, [
      h(Box, {gap: 16}, [
        h('h1', course?.name),
        h('span', {style:{color: 'blue'}}, [h('a.mono',{href:`https://forum.hyperlink.academy/c/${course?.id}`},  'Check out the course forum'), ' ➭'])
      ]),
      course?.description || '',
    ]),
    h(Tabs, {tabs: {
      Curriculum:  h(Text, {source: props.content}),
      Instances: h(Instances, {course: props.id}),
      Settings: isMaintainer ? h(Settings) : null
    }}),
    h(Sidebar, [h(Enroll, {course})]),
  ])
}

const Instances = (props:{course: string}) => {
  let {data: userInstances} = useUserInstances()
  let {data: course} = useCourseData(props.course)
  let {data: user} = useUserData()

  if(!course) return null
  let {userInvolved, upcoming, completed} = course.course_instances
    .sort((a, b) => new Date(a.start_date) > new Date(b.start_date) ? 1 : -1)
    .reduce((acc, instance)=> {
      if(user) {
        if(instance.facillitator === user.id ||
           userInstances?.course_instances.find(i => i.id === instance.id)
          ) acc.userInvolved.push(h(Instance, {instance}))
        return acc
      }
      if(instance.completed) acc.completed.push(h(Instance, {instance}))
      else acc.upcoming.push(h(Instance, {instance}))
    return acc
  }, {
    userInvolved:[] as React.ReactElement[],
    upcoming:[] as React.ReactElement[],
    completed:[] as  React.ReactElement[]
  })

  return h(Box, {gap:32}, [
    h('h2', "Instances"),
    h(Box, {gap: 32},[
       ...(userInvolved.length === 0 ? [] : [
         h('h3', 'Your Instances'),
         ...userInvolved,
         h(Seperator),
       ]),
      h('h3', 'Upcoming Instances'),
      ...upcoming,
      h('h3', 'Completed Instances'),
      ...completed
    ])])
}

type Instances =  Exclude<ReturnType<typeof useCourseData>["data"], undefined>['course_instances']
const Instance = (props: {instance: Instances[0]}) => {
  let {data: userInstances} = useUserInstances()
  let {data: user} = useUserData()

  let id= props.instance.id.split('-').slice(-1)[0]

  let inInstance = userInstances?.course_instances.find(x=> x.id===props.instance.id)
  let isFacillitator = user && props.instance.facillitator === user.id

  return h(Box, {gap: 16}, [
    h(Box, {gap: 8}, [
      !inInstance && !isFacillitator ? null : h('div', [
        inInstance ? h(Pill, 'enrolled') : null,
        ' ',
        isFacillitator ? h(Pill, {borderOnly: true}, 'facillitating') : null,
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

const Settings = () => {
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
  ])
}

const AddInstance = ()=> {
  let [newInstance, setNewInstance] = useState({start: '', facillitator: ''})
  let [formState, setFormState] = useState<'normal' | 'error' |'success' | 'loading'>('normal')
  let router = useRouter()
  let {data:courseData, mutate} = useCourseData(router.query.id as string)
  useEffect(()=>setFormState('normal'), [newInstance])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    setFormState('loading')
    let res = await callApi<CreateInstanceMsg, CreateInstanceResponse>('/api/courses/createInstance', {courseId: courseData.id, ...newInstance})
    if(res.status === 200) {
      mutate({
        ...courseData,
        course_instances: [...courseData.course_instances, {...res.result, people_in_instances:[], courses: {name: courseData.name}}]
      })
      setFormState('success')
    }
    else setFormState('error')
  }

  return h('form', {onSubmit}, [
    h(Box, {gap: 32, style: {width: 400}}, [
      h('h2', 'Add a new Instance'),
      formState === 'error' ? h(Error, 'An error occured') : null,
      formState === 'success' ? h(Info, 'Instance created!') : null,
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
      }, formState === 'loading' ? h(Loader) : 'Add a new Instance'),
      h(Seperator),
    ])
  ])
}

const EditDetails = ()=> {
  let [formData, setFormData] = useState({
    duration: '',
    prerequisites: '',
    description: ''
  })
  let [formState, setFormState] = useState<'normal' |'loading' | 'success' | 'error'>('normal')
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
    setFormState('loading')
    let res = await callApi<UpdateCourseMsg, UpdateCourseResponse>('/api/courses/updateCourse', {...formData, id:courseId})
    if(res.status === 200) {
      setFormState('success')
      console.log(res.result)
      if(course) mutate({...course, ...res.result})
    }
    else {
      setFormState('error')
    }
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
          formState === 'loading' ? h(Loader) : 'Save Changes')
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
  let content = await getTaggedPostContent(id, 'curriculum')

  return {props: {notFound: false, content, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
