import h from 'react-hyperscript'
import styled from '@emotion/styled'
import Markdown from 'react-markdown'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Box, Seperator, TwoColumn } from '../../../components/Layout'
import {Tabs} from '../../../components/Tabs'
import { colors } from '../../../components/Tokens'
import Loader from '../../../components/Loader'
import { Input, Label, Error, Info, Select, Textarea} from '../../../components/Form'
import {Pill} from '../../../components/Pill'

import { Category } from '../../../src/discourse'
import { Primary, Destructive} from '../../../components/Button'
import { useUserData, useUserInstances, useCourseData } from '../../../src/data'
import { courseDataQuery } from '../../api/get/[...item]'
import { CreateInstanceMsg, CreateInstanceResponse, UpdateCourseMsg, UpdateCourseResponse} from '../../api/courses/[action]'
import { callApi } from '../../../src/apiHelpers'
import Enroll from '../../../components/Course/Enroll'
import { InstanceCard } from '../../../components/Card'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const CoursePage = (props:Props) => {
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
  return h(TwoColumn, [
    h(Content, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h('h1', course?.name),
          h('span', {style:{color: 'blue'}}, [h('a.mono',{href:`https://forum.hyperlink.academy/c/${course?.id}`},  'Check out the course forum'), ' ➭'])
        ]),
        course?.description || '',
        !userInstances ? null :
          h(Info, {style: {padding:'32px'}}, [
            h(Box, {gap:16}, [
              h('h3', "Your Instances"),
              ...userInstances.map(instance => h(InstanceCard, instance))
            ])
          ])
      ]),

      h(Tabs, {tabs: {
        Curriculum:  h(Text, {}, h(Markdown, {source: props.content})),
        Instances: h(Instances, {course: props.id}),
        Settings: isMaintainer ? h(Settings) : null
      }})
    ]),
    h(Side, [h(Enroll, {courseId: props.id})]),
  ])
}

export default CoursePage

const Instances = (props:{course: string}) => {
  let {data: userInstances} = useUserInstances()
  let {data: course} = useCourseData(props.course)
  let {data: user} = useUserData()

  return h(Box, {gap:32}, [
    h('h2', "Instances"),
    h(Box, {gap: 32},
      course?.course_instances?.flatMap(instance=>{
        let inInstance = userInstances?.course_instances.find(x=> x.id===instance.id)
        let isFacillitator = user && instance.facillitator === user.id
        return [
          h(Box, {gap: 16}, [
            !inInstance && !isFacillitator ? null : h('div', [
              inInstance ? h(Pill, 'enrolled') : null,
              ' ',
              isFacillitator ? h(Pill, {borderOnly: true}, 'facillitating') : null,
            ]),
            h('h3', {}, h(Link, {
              href:'/courses/[id]/[instanceID]',
              as:  `/courses/${instance.course}/${instance.id}`
            }, h('a', instance.id))),
            h(Box, {style: {color: colors.textSecondary}, gap: 4}, [
              h('strong', `Starts ${prettyDate(instance.start_date)}`),
              h('div', `Facillitated by ${instance.people.display_name}`)
            ])
          ]),
          h(Seperator)
        ]
      }))])
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
        course_instances: [...courseData.course_instances, {...res.result, people_in_instances:[]}]
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
        }, courseData?.course_maintainers.map(maintainer => {
          return h('option', {value: maintainer.maintainer}, maintainer.people.display_name)
        })),
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
      h(Primary, {type: 'submit'}, formState === 'loading' ? h(Loader) : 'Add a new Instance'),
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
            duration: course.prerequisites,
            description: course.description
          })
        }}, "Discard Changes"),
        h(Primary, {type: 'submit', disabled: !changed},
          formState === 'loading' ? h(Loader) : 'Save Changes')
      ])
    ])
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

const SubmitButtons = styled('div')`
justify-self: right;
display: grid;
grid-template-columns: auto auto;
grid-gap: 16px;
`

const Side = styled('div')`
grid-column: 2;
grid-row: 1;
@media(max-width: 1016px) {
grid-column: 1;
}
`

const Content  = styled('div')`
display: grid;
grid-gap: 64px;
grid-auto-rows: min-content;

@media(max-width: 1016px) {
grid-row: 2;
}
`

const Text = styled('div')`
h1 {
  margin-top: 64px;
  margin-bottom: 8px;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  font-size: 2rem;
}

h2 {
  margin-top: 32px;
  margin-bottom: 8px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.375rem;

}

h3 {
  margin-top: 24px;
  margin-bottom: 8px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1rem;

}

h4 {
  margin-top: 16px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: .8rem;
  color: ${colors.textSecondary};
  text-transform: uppercase;
}

h5 {
  margin-top: 8px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: .8rem;
  color: ${colors.textSecondary};
}

h6 {
  margin-top: 8px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 500;
  font-size: .8rem;
  color: ${colors.textSecondary};
}

p {
  margin-bottom: 16px;
}

li {
  margin-bottom: 8px;
  margin-top: 8px;
}
`
export const getStaticProps = async (ctx:any) => {
  let id = (ctx.params?.id || '' )as string

  let content = await getCourseContent(id)
  let data = await courseDataQuery(id)

  return {props: {content, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}

const getCourseContent = async (id:string) => {
  let res = await fetch(`https://forum.hyperlink.academy/c/${id}.json`)
  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find((topic) => topic.pinned === true)?.id
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID)
  return await topicRequest.text()
}
