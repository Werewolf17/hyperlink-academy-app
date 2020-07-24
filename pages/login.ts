import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { Box, LabelBox, FormBox } from '../components/Layout'
import { Input, Error, Info } from '../components/Form'
import { Primary, LinkButton } from '../components/Button'
import {AccentImg} from '../components/Images'
import { useApi } from '../src/apiHelpers'
import { Result, Msg } from './api/login'
import { RequestMsg, RequestResult } from './api/resetPassword/[action]'
import Loader from '../components/Loader'
import { useUserData } from '../src/data'

const COPY = {
  emailOrUsernameInput: "Your Email or Username",
  passwordInput: "Password",
  resetPassword: "Reset password",
  loginHeader: "Welcome Back!",
  createAccount: "Create a new account",
  wrongLogin: h('div', [
    "Heck! The email or username didn't match the password. ", h('br'), "If you want, you can ",
    h(Link, { href: '/login?reset' }, h('a', 'reset your password here')),
    '.'
  ]),
  loginButton: "Log In"
}

const Login = () => {
  let router = useRouter()
  let [formData, setFormData] = useState({ emailOrUsername: '', password: '' })
  let redirect = router.query.redirect as string | null
  let { reset } = router.query
  let { data, mutate } = useUserData()
  let [status, callLogin] = useApi<Msg, Result>([formData], async (result)=> {
    if (redirect) {
      if (redirect[0] !== '/' || redirect.startsWith('/sso')) return window.location.assign(redirect)
      await mutate(result)
      await router.push(redirect as string)
    }
    else await router.push('/dashboard')
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    callLogin('/api/login', formData)
  }

  useEffect(()=> {if (data) router.push(redirect as string || '/dashboard')},[data])
  if (typeof reset !== 'undefined') return h(ResetPassword)

  return h(FormBox, {onSubmit, width: 400, ma: true}, [
    h('h1', COPY.loginHeader),
    status === 'error' ? h(Error, {}, COPY.wrongLogin) : null,
    h(LabelBox, {gap:16}, [
      h('h4', COPY.emailOrUsernameInput),
      h(Input, {
        type: 'text',
        value: formData.emailOrUsername,
        required: true,
        onChange: (e) => setFormData({ ...formData, emailOrUsername: e.currentTarget.value })
      }),
    ]),
    h(LabelBox, {gap:16}, [
      h('h4', COPY.passwordInput),
      h(Input, {
        type: 'password',
        value: formData.password,
        required: true,
        onChange: (e) => setFormData({ ...formData, password: e.currentTarget.value })
      }),
      h(Link, { href: '/login?reset' }, h(LinkButton, COPY.resetPassword))
    ]),
    h(Box, {gap: 8, style: {justifySelf: 'end', justifyItems: "end"}}, [
      h(Primary, { type: 'submit' }, status === 'loading' ? h(Loader) : COPY.loginButton),
      h(Link, { href: '/signup' }, h(LinkButton, COPY.createAccount))
    ])
  ])
}

const RESETCOPY = {
  header: "Reset Password",
  emailInput: "Your account email",
  button: "Reset Password",
  successHeader: "Check your Email"
}

const ResetPassword: React.SFC = () => {
  let [email, setEmail] = useState('')
  let [status, callResetPassword, setStatus] = useApi<RequestMsg, RequestResult>([email])
  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    await callResetPassword('/api/resetPassword/request', { email })
  }

  switch (status) {
    case 'normal':
    case 'loading':
      return h(FormBox, {onSubmit, width: 400, ma:true}, [
        h('h1', RESETCOPY.header),
        h(LabelBox, {gap:16}, [
          h('h4', RESETCOPY.emailInput),
          h(Input, {
            type: 'email',
            required: true,
            value: email,
            onChange: e => setEmail(e.currentTarget.value)
          }),
        ]),
        h('div', { style: { display: 'grid', justifyItems: 'end', gridGap: '8px' } }, [
          h(Primary, { type: 'submit' }, status === 'loading' ? h(Loader) : RESETCOPY.button)
        ])
      ])
    case 'success': return h(Box, { gap: 16, width: 400, ma: true }, [
      h(AccentImg, {src: '/img/plane.gif', alt: "an animated gif of a paper airplane taking off"}),
      h('h1', RESETCOPY.successHeader),
      'We sent an email with a password reset link to',
      h(Info, email),
      'It expires in 30 minutes.',
      h('br'),
      h(Primary, {
        style: { width: '100%' },
        onClick: () => setStatus('normal')
      }, 'Send another link')
    ])
    case 'error': return h(Box, {width: 400, ma: true}, [h(Error, 'something went wrong, please refresh and try again')])
  }
}

export default Login
