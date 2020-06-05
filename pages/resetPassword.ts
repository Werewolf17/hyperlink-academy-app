import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Box} from '../components/Layout'
import {Primary} from '../components/Button'
import { Input, Error, Label, Info} from '../components/Form'
import {ResetMsg, ResetResult} from './api/resetPassword/[action]'
import Loader from '../components/Loader'
import { useApi } from '../src/apiHelpers'

const COPY = {
  header: "Reset Password",
  button: "Reset Password",
  passwordInput: "New Password",
  confirmInput: "Confirm Password",
  error: h(Error, [
    'Looks like that link is expired or invalid, please try to ', h(Link, {href:"/login?reset"}, h('a', 'reset your password')),
    ' again'
  ])
}

const ResetPassword = ()=>{
  let [formData, setFormData] = useState({password:'', confirmPassword: ''})
  let [status, callResetPassword] = useApi<ResetMsg, ResetResult>([formData])
  let router = useRouter()
  let key = router.query.key as string

  useEffect(()=>{
    if(status === 'success') {
      setTimeout(()=> {
        router.push('/login')
      }, 5000)
    }
  })

  if(!key || typeof key !== 'string') return COPY.error

  const onSubmit = async (e:React.FormEvent)=> {
    e.preventDefault()
    await callResetPassword('/api/resetPassword/reset', {key, password: formData.password})
  }

  switch(status) {
    case 'normal':
    case 'loading':
      return h('form', {onSubmit}, h(Box, {width:400, ma: true }, [
        h('h1', COPY.header),
        h(Label, [
          COPY.passwordInput,
          h(Input, {
            type: 'password',
            value: formData.password,
            onChange: e => setFormData({...formData, password:e.target.value})
          }),
        ]),
        h(Label, [
          COPY.confirmInput,
          h(Input, {
            type: 'password',
            value: formData.confirmPassword,
            onChange: e => setFormData({...formData, confirmPassword:e.target.value})
          })
        ]),
        h(Primary, {type: 'submit', style: {justifySelf:'end'}}, status === 'loading' ? h(Loader) : 'Submit')
      ]))
    case 'success': return h(Info, [
      'Awesome, we reset your password, go ahead and ',
      h(Link, {href:'/login'}, h('a', 'login'))
    ])
    case 'error': return COPY.error
  }
}

export default ResetPassword