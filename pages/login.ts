import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'
import {useRouter} from 'next/router'

import {Section} from '../components/Section'
import {getToken} from '../src/token'
import {Form, Button, Input, Error} from '../components/Form'
import {Msg} from './api/login'
import {Msg as ResetMsg} from './api/requestResetPassword'
import Link from 'next/link'

const Login = () => {
  let [email, setEmail] = useState('')
  let [password, setPassword] = useState('')
  let [loading, setLoading] = useState(false)
  let [error, setError] = useState<'wrong username or password' | null>(null)
  let router = useRouter()
  let {redirect, reset} = router.query

  useEffect(()=>setError(null), [email, password])

  if(typeof reset !== 'undefined') return h(ResetPassword)

  return h(Section, {}, [
    h(Form, {onSubmit: async (e) => {
      e.preventDefault()
      let msg:Msg = {email, password}
      setLoading(true)
      let res = await fetch('/api/login', {
        method: "POST",
        body: JSON.stringify(msg)
      })
      if(res.status === 200) {
        window.location.assign(redirect as string || '/')
      }
      else {
        setLoading(false)
        setError('wrong username or password')
      }
    }}, [
      error ? h(Error, error) : null,
      h(Input, {type: 'email', placeholder: 'email',
                value: email,
                onChange: (e)=> setEmail(e.currentTarget.value)}),
      h(Input, {type: 'password', placeholder: 'password',
                value: password,
                onChange: (e)=> setPassword(e.currentTarget.value)}),
      loading ? h('p', 'loading') : h(Button, {type: 'submit'}, 'login')
    ]),
    h(Link, {href: '/login?reset'}, h('a', 'forgot your password?'))
  ])
}

const ResetPassword:React.SFC = () => {
  let [email, setEmail ] = useState('')
  let [status, setStatus] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')

  switch(status) {
    case 'normal':
      return h(Section, [
        h('h3', 'Reset your password'),
        h(Form, {onSubmit: async e =>{
          e.preventDefault()
          setStatus('loading')
          let msg:ResetMsg = {email}

          let res = await fetch('/api/requestResetPassword', {
            method: "POST",
            body: JSON.stringify(msg)
          })

          if(res.status === 200) setStatus('success')
          else setStatus('error')
        }}, [
          h(Input, {
            type: 'email',
            value: email,
            placeholder: 'your account email',
            onChange: e=>setEmail(e.currentTarget.value)
          }),
          h(Button, {type: 'submit'}, 'reset password')
        ])
      ])
    case 'loading': return h(Section, [h('div', 'Loading...')])
    case 'success': return h(Section, [h('div', 'Sent you an email! Check there to reset your password')])
    case 'error': return h(Section, [h(Error, 'something went wrong, please refresh and try again')])
  }
}

export default Login

Login.getInitialProps = ({req, res}:NextPageContext) => {
  if(req && res) {
    if(getToken(req)) {
      res.writeHead(301, {Location: '/'})
      res.end()
    }
  }
  return {}
}
