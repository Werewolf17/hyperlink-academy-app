import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { Box } from '../components/Layout'
import { Input, Error, Label, Info } from '../components/Form'
import { Primary, LinkButton } from '../components/Button'
import { callApi } from '../src/apiHelpers'
import { Result, Msg } from './api/login'
import { RequestMsg, RequestResult } from './api/resetPassword/[action]'
import Loader from '../components/Loader'
import { useUserData } from '../src/data'
import {TitleImg} from '../components/Images'

const Login = () => {
  let router = useRouter()
  let [formData, setFormData] = useState({ email: '', password: '' })
  let [formState, setFormState] = useState<'error' | 'normal' | 'loading'>('normal')

  let { data, mutate } = useUserData()

  let redirect = router.query.redirect as string | null
  let { reset } = router.query
  if (data) router.push(redirect as string || '/')

  useEffect(() => setFormState('normal'), [formData])

  if (typeof reset !== 'undefined') return h(ResetPassword)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    let res = await callApi<Msg, Result>('/api/login', formData)
    if (res.status === 200) {
      let data = res.result
      if (redirect) {
        if (redirect[0] !== '/' || redirect.startsWith('/sso')) return window.location.assign(redirect)
        await mutate(data)
        router.push(redirect as string)
      }
      else router.push('/dashboard')
    }
    else {
      setFormState('error')
    }
  }

  return h(Box.withComponent('form'), {width: 400, ma: true, onSubmit}, [
    h(TitleImg, { height: 163, width: 299, src: '/img/dragon.png' }),
    h('h1', 'Welcome Back!'),
    formState === 'error' ? h(Error, {}, h('div', [
      "That email and password don't match. You can ",
      h(Link, { href: '/login?reset' }, h('a', 'reset your password here')),
      '.'
    ])) : null,
    h(Label, [
      'Your Email',
      h(Input, {
        type: 'email',
        value: formData.email,
        required: true,
        onChange: (e) => setFormData({ ...formData, email: e.currentTarget.value })
      }),
    ]),
    h(Label, [
      'Password',
      h(Input, {
        type: 'password',
        value: formData.password,
        required: true,
        onChange: (e) => setFormData({ ...formData, password: e.currentTarget.value })
      }),
      h(Link, { href: '/login?reset' }, h(LinkButton, 'Reset Password'))
    ]),
    h(Primary, { type: 'submit', style: { justifySelf: 'end' } }, formState === 'loading' ? h(Loader) : 'Log In'),
  ])
}


const ResetPassword: React.SFC = () => {
  let [email, setEmail] = useState('')
  let [status, setStatus] = useState<'normal' | 'loading' | 'success' | 'error'>('normal')
  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    let res = await callApi<RequestMsg, RequestResult>('/api/resetPassword/request', { email })

    if (res.status === 200) setStatus('success')
    else setStatus('error')
          }

  switch (status) {
    case 'normal':
    case 'loading':
      return h(Box.withComponent('form'), {width: 400, ma:true, onSubmit}, [
        h('h1', 'Reset your password'),
        h(Label, [
          'Your Account Email',
          h(Input, {
            type: 'email',
            value: email,
            placeholder: 'your account email',
            onChange: e => setEmail(e.currentTarget.value)
          }),
        ]),
        h('div', { style: { display: 'grid', justifyItems: 'end', gridGap: '8px' } }, [
          h(Primary, { type: 'submit' }, status === 'loading' ? h(Loader) : 'reset password')
        ])
      ])
    case 'success': return h(Box, { gap: 16, width: 400, ma: true }, [
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
