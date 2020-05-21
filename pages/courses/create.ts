import h from 'react-hyperscript'
import { useUserData } from '../../src/data'
import { useRouter } from 'next/router'
import { Form, Input, Label, Error, Info, Textarea} from '../../components/Form'
import { Primary } from '../../components/Button'
import { useState, useEffect } from 'react'
import { callApi } from '../../src/apiHelpers'
import { CreateCourseMsg, CreateCourseResponse } from '../api/courses/[action]'
import Loader from '../../components/Loader'

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

  let [formState, setFormState] = useState<'normal' | 'error' |'success' | 'loading'>('normal')

  useEffect(()=>setFormState('normal'), [formData])

  if(user === false) router.push('/')
  if(user &&  user.admin === false) router.push('/dashboard')

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    let res = await callApi<CreateCourseMsg, CreateCourseResponse>('/api/courses/createCourse', {
      ...formData
    })
    if(res.status === 200) setFormState('success')
  }

  return h('div', [
    h('h1', 'Create a new course'),
    formState === 'error' ? h(Error, 'An error occured') : null,
    formState === 'success' ? h(Info, 'Course created!') : null,
    h(Form, {onSubmit},[
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
        h(Input, {
          required: true,
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
        'duration',
        h(Textarea, {
          value: formData.duration,
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
      h(Primary, {type: 'submit'}, formState === 'loading' ? h(Loader) : 'submit')
    ])

  ])
}

export default CreateCourse
