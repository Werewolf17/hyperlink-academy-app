import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {  Input, Label, Error, Info, Textarea} from '../../components/Form'
import { Primary } from '../../components/Button'
import Loader from '../../components/Loader'

import { useApi } from '../../src/apiHelpers'
import { useUserData } from '../../src/data'
import { Box } from '../../components/Layout'
import { CreateCourseMsg } from '../api/courses'
import { CreateCohortResponse } from '../api/courses/[id]/cohorts'

const CreateCourse = ()=> {
  let {data: user} = useUserData()
  let router = useRouter()
  let [formData, setFormData] = useState({
    courseId: '',
    name: '',
    description: '',
    prerequisites: '',
    duration: "",
    cost: 5,
    maintainers: [] as string[]
  })

  let [status, callCreateCourse] = useApi<CreateCourseMsg, CreateCohortResponse>([formData])

  if(user === false) router.push('/')
  if(user &&  user.admin === false) router.push('/dashboard')

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    await callCreateCourse('/api/courses', {...formData})
  }

  return h('div', [
    h('h1', 'Create a new course'),
    status === 'error' ? h(Error, 'An error occured') : null,
    status === 'success' ? h(Info, 'Course created!') : null,
    h('form', {onSubmit}, h(Box, [
      h(Label, [
        'id',
        h(Input, {
          type: 'text',
          required: true,
          value: formData.courseId,
          onChange: e=> setFormData({...formData, courseId: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'name',
        h(Input, {
          required: true,
          type: 'text',
          value: formData.name,
          onChange: e=> setFormData({...formData, name: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'description',
        h(Textarea, {
          required: true,
          value: formData.description,
          onChange: e=> setFormData({...formData, description: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'duration',
        h(Input, {
          type: 'text',
          value: formData.duration,
          onChange: e=> setFormData({...formData, duration: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'prerequisites',
        h(Textarea, {
          value: formData.prerequisites,
          onChange: e=> setFormData({...formData, prerequisites: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'cost',
        h(Input, {
          required: true,
          type: 'number',
          min: '5',
          max: '1000',
          value: formData.cost,
          onChange: e=> setFormData({...formData, cost: parseInt(e.currentTarget.value)})
        })
      ]),
      h(Label, [
        'maintainers',
        h(Input, {
          required: true,
          type: 'email',
          multiple: true,
          onChange: e=> setFormData({...formData, maintainers: e.currentTarget.value.split(',')})
        })
      ]),
      h(Primary, {type: 'submit'}, status === 'loading' ? h(Loader) : 'submit')
    ]))

  ])
}

export default CreateCourse
