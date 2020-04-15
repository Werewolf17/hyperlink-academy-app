import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import {Narrow} from '../components/Layout'
import { Form, Button, Input, Error, Label, Info} from '../components/Form'
import {ResetMsg, Response} from './api/resetPassword/[action]'
import Loader from '../components/Loader'

export default ()=>{
  let [inputs, setInputs] = useState({password:'', confirmPassword: ''})
  let [status, setStatus] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')
  let router = useRouter()
  let {key} = router.query

  useEffect(()=>{
    if(status === 'success') {
      setTimeout(()=> {
        router.push('/login')
      }, 5000)
    }
  })

  if(!key || typeof key !== 'string') return h(Error, ['Broken link, please try to ', h(Link, {href:"/login?reset"}, h('a', 'reset your password again'))])

  const onSubmit = async (e:React.FormEvent)=> {
    e.preventDefault()
    setStatus('loading')
    let msg:ResetMsg = {key: key as string, password: inputs.password}
    let res = await fetch('/api/resetPassword/reset', {
      method: "POST",
      body: JSON.stringify(msg)
    })
    let result:Response = await res.json()
    if(result.success) setStatus('success')
    else setStatus('error')
  }

  switch(status) {
    case 'normal':
    case 'loading':
      return h(Narrow, [
        h(Form, {onSubmit}, [
          h('h1', 'Reset your password'),
          h(Label, [
            "A New Password",
            h(Input, {
              type: 'password',
              value: inputs.password,
              onChange: e => setInputs({...inputs, password:e.target.value})
            }),
          ]),
          h(Label, [
            "Confirm Password",
            h(Input, {
              type: 'password',
              value: inputs.confirmPassword,
              onChange: e => setInputs({...inputs, confirmPassword:e.target.value})
            })
          ]),
          h(Button, {type: 'submit'}, status === 'loading' ? h(Loader) : 'submit')
        ])
      ])
    case 'success': return h(Info, [
      'Awesome, we reset your password, go ahead and ',
      h(Link, {href:'/login'}, h('a', 'login'))
    ])
    case 'error': return h(Error, 'something went wrong, please try again')
  }

}
