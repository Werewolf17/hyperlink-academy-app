import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'
import {useRouter} from 'next/router'
import Link from 'next/link'

import {Narrow} from '../components/Layout'
import {getToken} from '../src/token'
import {Form, Input, Error, Label, Submit} from '../components/Form'
import {Primary, LinkButton} from '../components/Button'
import {Msg} from './api/login'
import {Msg as ResetMsg} from './api/requestResetPassword'

const Login = () => {
  let [email, setEmail] = useState('')
  let [password, setPassword] = useState('')

  type Errors = 'wrong'
  let [error, setError] = useState<Errors | null>(null)
  let router = useRouter()
  let {redirect, reset} = router.query

  useEffect(()=>setError(null), [email, password])

  if(typeof reset !== 'undefined') return h(ResetPassword)

  const onSubmit = async (e:React.FormEvent) => {
      e.preventDefault()
      let msg:Msg = {email, password}
      let res = await fetch('/api/login', {
        method: "POST",
        body: JSON.stringify(msg)
      })
      if(res.status === 200) {
        window.location.assign(redirect as string || '/')
      }
      else {
        setError('wrong')
      }
  }

  const Errors: {[key in Errors]: React.ReactElement} = {
    'wrong': h('div', [
      "That email and password don't match. You can ",
      h(Link, {href: '/login?reset'}, h('a', 'reset your password here')),
      '.'
    ])
  }

  return h(Narrow, {}, [
    h(Form, {onSubmit}, [
      h('h1', 'Welcome Back!'),
      error ? h(Error, {}, Errors[error]) : null,
      h(Label, [
        'Your Email',
        h(Input, {
          type: 'email',
          value: email,
          required:true,
          onChange: (e)=> setEmail(e.currentTarget.value)
        }),
      ]),
      h(Label, [
        'Password',
        h(Input, {
          type: 'password',
          value: password,
          required:true,
          onChange: (e)=> setPassword(e.currentTarget.value)
        }),
      ]),
      h(Submit, [
        h(Primary, {type: 'submit'}, 'Log In'),
        h(Link, {href: '/login?reset'}, h(LinkButton, 'Reset Password'))
      ])
    ]),
  ])
}

const ResetPassword:React.SFC = () => {
  let [email, setEmail ] = useState('')
  let [status, setStatus] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')

  switch(status) {
    case 'normal':
      return h(Narrow, [
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
          h('h1', 'Reset your password'),
          h(Label, [
            'Your Account Email',
            h(Input, {
              type: 'email',
              value: email,
              placeholder: 'your account email',
              onChange: e=>setEmail(e.currentTarget.value)
            }),
          ]),
          h('div', {style: {display: 'grid', justifyItems:'end', gridGap: '8px'}}, [
            h(Primary, {type: 'submit'}, 'reset password')
          ])
        ])
      ])
    case 'loading': return h(Narrow, [h('div', 'Loading...')])
    case 'success': return h(Narrow, [h('div', 'Sent you an email! Check there to reset your password')])
    case 'error': return h(Narrow, [h(Error, 'something went wrong, please refresh and try again')])
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
