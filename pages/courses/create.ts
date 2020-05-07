import h from 'react-hyperscript'
import { useUserData } from '../../src/user'
import { useRouter } from 'next/router'
import {Form, Input, Label} from '../../components/Form'
import { Primary } from '../../components/Button'
import { useState } from 'react'
import { callApi } from '../../src/apiHelpers'
import { CreateCourseMsg, CreateCourseResponse } from '../api/courses/[action]'

const CreateCourse = ()=> {
  let {data: user} = useUserData()
  let router = useRouter()
  let [formData, setFormData] = useState({
    courseId: '',
    name: '',
    description: '',
    duration: "",
    cost: 5,
    maintainers: [] as string[]
  })

  if(user === false) router.push('/')
  if(user &&  user.admin === false) router.push('/dashboard')

  const onSubmit = (e:React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
    callApi<CreateCourseMsg, CreateCourseResponse>('/api/courses/createCourse', {
      ...formData
    })
  }

  return h('div', [
    h('h1', 'Create a new course'),
    h(Form, {onSubmit},[
      h(Label, [
        'id',
        h(Input, {
          type: 'text',
          value: formData.courseId,
          onChange: e=> setFormData({...formData, courseId: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'name',
        h(Input, {
          type: 'text',
          value: formData.name,
          onChange: e=> setFormData({...formData, name: e.currentTarget.value})
        })
      ]),
      h(Label, [
        'description',
        h(Input, {
          type: 'text',
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
        'cost',
        h(Input, {
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
          type: 'email',
          multiple: true,
          onChange: e=> setFormData({...formData, maintainers: e.currentTarget.value.split(',')})
        })
      ]),
      h(Primary, {type: 'submit'}, 'submit')
    ])

  ])
}

export default CreateCourse
