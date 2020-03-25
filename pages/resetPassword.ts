import h from 'react-hyperscript'

import {Section} from '../components/Section'
import {Form, Button, Input, Error} from '../components/Form'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import {Msg, Response} from './api/resetPassword'
import Link from 'next/link'

export default ()=>{
  let [inputs, setInputs] = useState({password:'', confirmPassword: ''})
  let [status, setStatus] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')
  let router = useRouter()
  let {key} = router.query
  if(!key || typeof key !== 'string') return h(Error, 'Broken link, please try reset your password again')

  useEffect(()=>{
    if(status === 'success') {
      setTimeout(()=> {
        router.push('/login')
      }, 5000)
    }
  })

  switch(status) {
    case 'normal':
      return h(Section, [
        h('h3', 'Reset your password'),
        h(Form, {onSubmit: async e=> {
          e.preventDefault()
          setStatus('loading')
          let msg:Msg = {key: key as string, password: inputs.password}
          let res = await fetch('/api/resetPassword', {
            method: "POST",
            body: JSON.stringify(msg)
          })
          let result:Response = await res.json()
          if(result.success) setStatus('success')
          else setStatus('error')
        }}, [
          h(Input, {
            type: 'password',
            placeholder: 'new password',
            value: inputs.password,
            onChange: e => setInputs({...inputs, password:e.target.value})
          }),
          h(Input, {
            type: 'password',
            placeholder: 'confirm new password',
            value: inputs.confirmPassword,
            onChange: e => setInputs({...inputs, confirmPassword:e.target.value})
          }),
          h(Button, {type: 'submit'}, 'submit')
        ])
      ])
    case 'loading': return h(Section, [h('div', 'Loading...')])
    case 'success': return h(Section, [
      'Awesome, we reset your password, go ahead and ',
      h(Link, {href:'/login'}, h('a', 'login'))
    ])
    case 'error': return h(Section, [h(Error, 'something went wrong, please try again')])
  }

}
