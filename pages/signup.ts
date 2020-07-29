import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Box, LabelBox, FormBox} from 'components/Layout'
import { Input, Error, Info, CheckBox, PasswordInput} from 'components/Form'
import { Primary, LinkButton} from 'components/Button'
import {AccentImg} from 'components/Images'
import { useUserData } from 'src/data'
import { callApi, useApi } from 'src/apiHelpers'
import { useDebouncedEffect} from 'src/hooks'
import { VerifyEmailMsg, SignupMsg, VerifyEmailResponse, SignupResponse} from 'pages/api/signup/[action]'
import { CheckUsernameResult } from 'pages/api/get/[...item]'

const COPY = {
   submitButton: "Create your account"
}

const Signup = () => {
  let [formData, setFormData] = useState({
    email:'',
    username: '',
    password:'',
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

  return h(FormBox, {onSubmit, width: 400, ma: true, gap: 32}, [
    h('h1', 'Sign Up'),
    status === 'error' ? h(Error, {}, h('div', [
      "A user already exists with that email. Try ", h(Link,{href:'/login'}, h('a', 'logging in')),
      '.'
    ])) : null,
    h(LabelBox, {gap:8},[
      h('div', [
        h('h4', "Username"),
        h('small.textSecondary', "Pick a unique username between 3-20 characters."),
      ]),
      h(Input, {type: 'text',
                name: "username",
                required: true,
                minLength: 3,
                maxLength: 20,
                value: formData.username,
                onChange: (e)=> {
                  setFormData({...formData, username:e.currentTarget.value})
                  if(/\s/.test(e.currentTarget.value)){
                    e.currentTarget.setCustomValidity('Your username cannot contain spaces.')
                  }
                  else {
                    e.currentTarget.setCustomValidity('')
                  }
                }}),
      usernameValid === null
        ? ''
        : usernameValid ? h('span.accentSuccess', 'Great! This username is available.') : h('span.accentRed', "Sorry, that username is taken.")
    ]),
    h(LabelBox, {gap:8}, [
      h('div', [
        h('h4', "Your Email"),
        h('small.textSecondary', "You'll have to verify this in a moment."),
      ]),
      h(Input, {type: 'email',
                name: 'email',
                required: true,
                value: formData.email,
                onChange: (e)=> setFormData({...formData, email:e.currentTarget.value})})
    ]),
    h(LabelBox, {gap:8}, [
      h("div", [
        h('h4', "Password"),
        h('small.textSecondary', "Minimum length 8 characters"),
      ]),
      h(PasswordInput, {
                name: "new-password",
                required: true,
                minLength: 8,
                value: formData.password,
                onChange: (e)=> setFormData({...formData, password:e.currentTarget.value})})
    ]),
    h(LabelBox, {gap:8}, [
      h('div', [
        h('h4', "Get email updates?"),
        h('small.textSecondary', "We send out occasional updates on new courses and features. We'll never spam or share your email."),
      ]),
      h(CheckBox, [
        h(Input, {type: 'checkbox', name: 'newsletter', checked: formData.newsletter, onChange: e=> {
          setFormData({...formData, newsletter: e.currentTarget.checked})
        }}),
        "Sure! Gimme the updates."
      ]),
    ]),
    h(Box, {gap: 8}, [
      h(Primary, {status, style: {justifySelf: 'end'}, type: 'submit'}, COPY.submitButton),
      h(Link, {href:"/login"}, h(LinkButton, {style:{justifySelf: 'end'}}, 'Log in with an existing account'))
    ])
  ])
}

const VerifyEmail = (props: {email?:string, resendEmail: any}) =>  {
  let router = useRouter()
  let [key, setKey] = useState('')
  let [status, callSignupVerify] = useApi<VerifyEmailMsg, VerifyEmailResponse>([key], ()=>{
    setTimeout(()=>{
      router.push('/dashboard')
    }, 3000)
  })

  const onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()
    await callSignupVerify('/api/signup/verify', {key})
  }

  useEffect(()=>{
    if(router.query.verifyEmail && typeof router.query.verifyEmail === 'string') {
      callSignupVerify('/api/signup/verify', {key:router.query.verifyEmail})
    }
  }, [])

  if(router.query.verifyEmail && status === null) return null

  if(status === 'success') return h(Box, {width: 400, ma:true, gap: 16}, [
      h('h1', "You're verified!"),
      h(Info, "Click the button below if you're not redirected in a couple seconds"),
      h(Primary, {onClick: ()=> router.push('/dashboard')}, 'Back to Hyperlink')
  ])

  return h(FormBox, {onSubmit, width: 400, ma: true, gap: 32}, [
    h(AccentImg, {src: '/img/plane.gif', alt: "an animated gif of a paper airplane taking off" }),
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
        h(Input, {
          type: 'text',
          value: key,
          onChange: e=>setKey(e.currentTarget.value)
        })
      ]),
    ]),
    h(Primary, {type: 'submit', status, style:{justifySelf: 'right'}}, "Confirm your email")
  ])
}

export default Signup
