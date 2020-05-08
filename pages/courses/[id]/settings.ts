import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {useEffect, useState} from 'react'

import { useUserData, useCourseData } from '../../../src/data'
import { callApi } from '../../../src/apiHelpers'
import { Form, Input, Label, Error, Info} from '../../../components/Form'
import {Primary} from '../../../components/Button'
import {CreateInstanceMsg, CreateInstanceResponse} from '../../api/courses/[action]'
import Loader from '../../../components/Loader'

const CourseSettings =  () => {
  let router = useRouter()
  let {data:user} = useUserData()
  let {data:courseData} = useCourseData(router.query.id as string)

  let [newInstance, setNewInstance] = useState({start: '', end: '', facillitator: ''})
  let [formState, setFormState] = useState<'normal' | 'error' |'success' | 'loading'>('normal')

  useEffect(()=>setFormState('normal'), [newInstance])

  useEffect(()=> {
    if(courseData) setNewInstance(instance => { return {...instance, facillitator: courseData?.course_maintainers[0].maintainer || ''} })
    if(courseData && !courseData.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id)) {
      router.push('/courses/[id]', `/courses/${courseData.id}`)
    }
  }, [courseData, user])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    setFormState('loading')
    let res = await callApi<CreateInstanceMsg, CreateInstanceResponse>('/api/courses/createInstance', {courseId: courseData.id, ...newInstance})
    if(res.status === 200) setFormState('success')
    else setFormState('error')
  }

  return h('div', [
    h(Link, {href: '/courses/[id]', as: `/courses/${router.query.id}`}, h('a', 'back to course')),
    h(Form, {onSubmit}, [
      h('h2', 'Create an instance'),
      formState === 'error' ? h(Error, 'An error occured') : null,
      formState === 'success' ? h(Info, 'Instance created!') : null,
      h(Label, [
        'Start Date',
        h(Input, {
          type: 'date',
          required: true,
          value: newInstance.start,
          onChange: e => setNewInstance({...newInstance, start: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'End Date',
        h(Input, {
          type: 'date',
          required: true,
          value: newInstance.end,
          onChange: e => setNewInstance({...newInstance, end: e.currentTarget.value})
        })
      ]),
      h('select', {
        required: true,
        onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewInstance({...newInstance, facillitator: e.currentTarget.value})
      }, courseData?.course_maintainers.map(maintainer => {
        return h('option', {value: maintainer.maintainer}, maintainer.people.display_name)
      })),
      h(Primary, {type: 'submit'}, formState === 'loading' ? h(Loader) : 'submit')
    ])
  ])
}

export default CourseSettings
