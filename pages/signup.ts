import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Box} from '../components/Layout'
import { Label, Input, Error, Info, CheckBox} from '../components/Form'
import {Primary} from '../components/Button'
import {AccentImg} from '../components/Images'
import { VerifyEmailMsg, SignupMsg, VerifyEmailResponse, SignupResponse} from './api/signup/[action]'
import Loader from '../components/Loader'
import { useUserData } from '../src/data'
import { callApi, useApi } from '../src/apiHelpers'
import { useDebouncedEffect} from '../src/hooks'
import { CheckUsernameResult } from './api/get/[...item]'

const Signup = () => {
  let [formData, setFormData] = useState({
    email:'',
    username: '',
    password:'',
    confPassword:'',
    newsletter: false,
  })

  let [status, callSignupRequest] = useApi<SignupMsg, SignupResponse>([formData], ()=> router.push('/signup?verifyEmail'))
  let [usernameValid, setUsernameValid] = useState<null | boolean>(null)
  let {data:user} = useUserData()
  let router = useRouter()

  useEffect(()=>{if(user) router.push('/dashboard')}, [user])
  useDebouncedEffect(async ()=>{
    if(!formData.username) return setUsernameValid(null)
    let res = await callApi<null, CheckUsernameResult>('/api/get/username/'+formData.username)
    if(res.status===404) setUsernameValid(true)
    else setUsernameValid(false)
  }, 500, [formData.username])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    await callSignupRequest('/api/signup/request', formData)
  }

  if(router.query.verifyEmail !== undefined) {
    return h(VerifyEmail, {email: formData.email, resendEmail: onSubmit})
  }

  return h('form', {onSubmit}, h(Box, {width: 400, ma: true}, [
    h('h1', 'Sign Up'),
    status === 'error' ? h(Error, {}, h('div', [
      "A user already exists with that email. Try ", h(Link,{href:'/login'}, h('a', 'logging in')),
      '.'
    ])) : null,
    h(Label, [
      "Your username",
      h(Input, {type: 'text',
                required: true,
                minLength: 3,
                maxLength: 20,
                value: formData.username,
                onChange: (e)=> {
                  setFormData({...formData, username:e.currentTarget.value})
                  if(/\s/.test(e.currentTarget.value)){
                    e.currentTarget.setCustomValidity('Your username cannot contain spaces')
                  }
                  else {
                    e.currentTarget.setCustomValidity('')
                  }
                }}),
      usernameValid === null
        ? ''
        : usernameValid ? h('span.accentSuccess', 'Great! This username is available') : h('span.accentRed', "Sorry, that username is taken")
    ]),
    h(Label, [
      "Your Email",
      h(Input, {type: 'email',
                required: true,
                value: formData.email,
                onChange: (e)=> setFormData({...formData, email:e.currentTarget.value})})
    ]),
    h(Label, [
      "A Password",
      h(Input, {type: 'password',
                required: true,
                minLength: 8,
                value: formData.password,
                onChange: (e)=> setFormData({...formData, password:e.currentTarget.value})})
    ]),
    h(Label, [
      "Confirm Password",
      h(Input, {type: 'password',
                required: true,
                value: formData.confPassword,
                onChange: (e)=> {
                  setFormData({...formData, confPassword:e.currentTarget.value})
                  if(e.currentTarget.value !== formData.password) {
                    e.currentTarget.setCustomValidity('Your passwords do not match')
                  }
                  else {
                    e.currentTarget.setCustomValidity('')
                  }
                }
               })
    ]),
    h(CheckBox, [
      h(Input, {type: 'checkbox', checked: formData.newsletter, onChange: e=> {
        setFormData({...formData, newsletter: e.currentTarget.checked})
      }}),
      "Do you want to receive our newsletter?"
    ]),
    h(Primary, {style: {justifySelf: 'end'}, type: 'submit'}, status === 'loading' ? h(Loader) : 'Submit')
  ]))
}

const VerifyEmail = (props: {email?:string, resendEmail: any}) =>  {
  let router = useRouter()
  let [key, setKey] = useState('')
  let [status, callSignupVerify] = useApi<VerifyEmailMsg, VerifyEmailResponse>([key])

  const onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()
    await callSignupVerify('/api/signup/verify', {key})
  }

  useEffect(()=>{
    if(router.query.verifyEmail && typeof router.query.verifyEmail === 'string') {
      callSignupVerify('/api/signup/verify', {key:router.query.verifyEmail})
    }
  }, [])

  useEffect(()=>{
    if(status !== 'success') return
    setTimeout(()=>{
      router.push('/dashboard')
    }, 3000)
  }, [status])

  if(router.query.verifyEmail && status === null) return null

  if(status === 'success') return h(Box, {width: 400, ma:true, gap: 16}, [
      h('h1', "You're verified!"),
      h(Info, "Click the button below if you're not redirected in a couple seconds"),
      h(Primary, {onClick: ()=> router.push('/dashboard')}, 'Back to hyperlink')
  ])

  return h('form', {onSubmit}, h(Box, {width: 400, ma: true, gap: 32}, [
    h(AccentImg, {src: '/img/plane.gif'}),
    h('h1', 'Verify your email'),
    props.email ? h(Box, {gap: 8}, [
      `Sweet! We sent an email with a verification code to`,
      h(Info, props.email),
    ]) : null,
    h(Box, {gap: 8}, [
      `Copy the code there and submit it here:`,
      status === 'error' ? h(Error, {}, [
        'Your email link is invalid or out of date, please try ',
        h(Link, {href:'/signup'}, h('a', 'signing up again' )), '.'
      ]) : null,
      h('div', {style: {width: '100%'}}, [
        h(Label, [
          h(Input, {
            type: 'text',
            value: key,
            onChange: e=>setKey(e.currentTarget.value)
          })
        ])
      ]),
    ]),
    h(Primary, {type: 'submit', style:{justifySelf: 'right'}}, status  === 'loading' ? h(Loader) : "Confirm your email")
  ]))
}

export default Signup
