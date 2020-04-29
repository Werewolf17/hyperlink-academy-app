import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {useEffect, useState} from 'react'

import { useUserData, useCourseData } from '../../../src/user'
import { callApi } from '../../../src/apiHelpers'
import { Form, Input, Label} from '../../../components/Form'
import {Primary} from '../../../components/Button'
import {CreateInstanceMsg, CreateInstanceResponse} from '../../api/courses/createInstance'

const CourseSettings =  () => {
  let router = useRouter()
  let {data:user} = useUserData()
  let {data:courseData} = useCourseData(router.query.id as string)

  let [newInstance, setNewInstance] = useState({start: '', end: '', facillitator: ''})

  useEffect(()=> {
    if(courseData) setNewInstance(instance => { return {...instance, facillitator: courseData?.course_maintainers[0].maintainer || ''} })
    if(courseData && !courseData.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id)) {
      router.push('/courses/[id]', `/courses/${courseData.id}`)
    }
  }, [courseData, user])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    console.log(newInstance)
    let res = await callApi<CreateInstanceMsg, CreateInstanceResponse>('/api/courses/createInstance', {courseId: courseData.id, ...newInstance})
    console.log(res)
  }

  return h('div', [
    h(Link, {href: '/courses/[id]', as: `/courses/${router.query.id}`}, h('a', 'back to course')),
    h(Form, {onSubmit}, [
      h('h2', 'Create an instance'),
      h(Label, [
        'Start Date',
        h(Input, {
          type: 'date',
          value: newInstance.start,
          onChange: e => setNewInstance({...newInstance, start: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'End Date',
        h(Input, {
          type: 'date',
          value: newInstance.end,
          onChange: e => setNewInstance({...newInstance, end: e.currentTarget.value})
        })
      ]),
      h('select', {
        onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewInstance({...newInstance, facillitator: e.currentTarget.value})
      }, courseData?.course_maintainers.map(maintainer => {
        return h('option', {value: maintainer.maintainer}, maintainer.people.display_name)
      })),
      h(Primary, {type: 'submit'}, 'submit')
    ])
  ])
}

export default CourseSettings
