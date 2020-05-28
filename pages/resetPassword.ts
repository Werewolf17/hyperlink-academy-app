import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Box} from '../components/Layout'
import {Primary} from '../components/Button'
import { Input, Error, Label, Info} from '../components/Form'
import {ResetMsg, ResetResult} from './api/resetPassword/[action]'
import Loader from '../components/Loader'
import { callApi } from '../src/apiHelpers'

const ResetPassword = ()=>{
  let [formData, setFormData] = useState({password:'', confirmPassword: ''})
  let [formState, setFormState] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')
  let router = useRouter()
  let key = router.query.key as string

  useEffect(()=>{
    if(formState === 'success') {
      setTimeout(()=> {
        router.push('/login')
      }, 5000)
    }
  })

  if(!key || typeof key !== 'string') return h(Error, ['Broken link, please try to ', h(Link, {href:"/login?reset"}, h('a', 'reset your password again'))])

  const onSubmit = async (e:React.FormEvent)=> {
    e.preventDefault()
    setFormState('loading')
    let res = await callApi<ResetMsg, ResetResult>('/api/resetPassword/reset',
                                                   {key, password: formData.password})
    if(res.status ===200) setFormState('success')
    else setFormState('error')
  }

  switch(formState) {
    case 'normal':
    case 'loading':
      return h('form', {onSubmit}, h(Box, {width:400, ma: true }, [
        h('h1', 'Reset your password'),
        h(Label, [
          "A New Password",
          h(Input, {
            type: 'password',
            value: formData.password,
            onChange: e => setFormData({...formData, password:e.target.value})
          }),
        ]),
        h(Label, [
          "Confirm Password",
          h(Input, {
            type: 'password',
            value: formData.confirmPassword,
            onChange: e => setFormData({...formData, confirmPassword:e.target.value})
          })
        ]),
        h(Primary, {type: 'submit'}, formState === 'loading' ? h(Loader) : 'Submit')
      ]))
    case 'success': return h(Info, [
      'Awesome, we reset your password, go ahead and ',
      h(Link, {href:'/login'}, h('a', 'login'))
    ])
    case 'error': return h(Error, 'something went wrong, please try again')
  }
}

export default ResetPassword
