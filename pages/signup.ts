import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Narrow, Box} from '../components/Layout'
import {Form, Label, Input, Error, Submit, Info} from '../components/Form'
import {Primary} from '../components/Button'
import TitleImg from '../components/TitleImg'
import { VerifyEmailMsg, SignupMsg, VerifyEmailResponse, SignupResponse} from './api/signup/[action]'
import Loader from '../components/Loader'
import { useUserData } from '../src/user'
import { callApi } from '../src/apiHelpers'

const Signup = () => {
  let [formState, setFormState] = useState({
    email:'',
    password:'',
    confPassword:'',
    display_name: ''
  })
  let [error, setError] = useState<'user exists' | null>(null)
  let [loading, setLoading] = useState(false)
  let {data:user} = useUserData()
  let router = useRouter()

  useEffect(()=>{
    setError(null)
  }, [formState.email])

  useEffect(()=>{if(user) router.push('/dashboard')}, [user])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let res = await callApi<SignupMsg, SignupResponse>('/api/signup/request', {
      email:formState.email, password: formState.password, display_name:  formState.display_name
    })
    if(res.status == 200) {router.push('/signup?verifyEmail')}
    else {
      setError('user exists')
    }
    setLoading(false)
  }

  const Errors: {[key in Exclude<typeof error, null>]: React.ReactElement} = {
    'user exists': h('div', [
      "A user already exists with that email. Try ", h(Link,{href:'/login'}, h('a', 'logging in')),
      '.'
    ])
  }

  if(router.query.verifyEmail !== undefined) {
    return h(VerifyEmail, {email: formState.email, resendEmail: onSubmit})
  }

  return h(Narrow, {}, [
    h(Form, {onSubmit}, [
      h(TitleImg, {height: 233, width: 130, src: '/img/start_journey_crop.png'}),
      h('h1', 'Start a journey'),
      error ? h(Error, {}, Errors[error]) : null,
      h(Label, [
        "Your Name",
        h(Input, {type: 'text',
                  required: true,
                  value: formState.display_name,
                  onChange: (e)=> setFormState({...formState, display_name:e.currentTarget.value})})
      ]),
      h(Label, [
        "Your Email",
        h(Input, {type: 'email',
                  required: true,
                  value: formState.email,
                  onChange: (e)=> setFormState({...formState, email:e.currentTarget.value})})
      ]),
      h(Label, [
        "A Password",
        h(Input, {type: 'password',
                  required: true,
                  minLength: 8,
                  value: formState.password,
                  onChange: (e)=> setFormState({...formState, password:e.currentTarget.value})})
      ]),
      h(Label, [
        "Confirm Password",
        h(Input, {type: 'password',
                  required: true,
                  value: formState.confPassword,
                  onChange: (e)=> {
                    setFormState({...formState, confPassword:e.currentTarget.value})
                    if(e.currentTarget.value !== formState.password) {
                      e.currentTarget.setCustomValidity('passwords do not match')
                    }
                    else {
                      e.currentTarget.setCustomValidity('')
                    }
                  }
                 })
      ]),
      h(Submit, [
        h(Primary, {type: 'submit'}, loading ? h(Loader) : 'Submit')
      ])
    ])
  ])
}

const VerifyEmail = (props: {email?:string, resendEmail: any}) =>  {
  let router = useRouter()
  let [key, setKey] = useState('')
  let [result, setResult] = useState<null | 'loading'| 'invalid' | 'success'>(null)

  const onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()

    setResult('loading')
    let res = await callApi<VerifyEmailMsg, VerifyEmailResponse>('/api/signup/verify', {key})
    if(res.status === 200) {
      setResult('success')
    }
    else setResult('invalid')
  }

  useEffect(()=>{
    if(router.query.verifyEmail && typeof router.query.verifyEmail === 'string') {
      callApi<VerifyEmailMsg, VerifyEmailResponse>('/api/signup/verify', {key: router.query.verifyEmail})
        .then(res => {
          if(res.status === 200) {
            setResult('success')
          }
          else setResult('invalid')
        })
    }
  }, [])

  useEffect(()=>{
    if(result !== 'success') return
    setTimeout(()=>{
      router.push('/dashboard')
    }, 3000)
  }, [result])

  if(router.query.verifyEmail && result === null) return null


  if(result === 'success') return h(Narrow, [
    h(Box, {gap: 16}, [
      h('h1', "You're verified!"),
      h(Info, "Click the button below if you're not redirected in a couple seconds"),
      h(Primary, {onClick: ()=> router.push('/dashboard')}, 'Back to hyperlink')
    ])
  ])

  return h(Narrow, [
    h(Box, {gap: 32}, [
      h(TitleImg, {height: 100, width: 100, src: '/img/plane.gif'}),
      h('h1', 'Verify your email'),
      props.email ? h(Box, {gap: 8}, [
        `Sweet! We sent an email with a verification code to`,
        h(Info, props.email),
      ]) : null,
      `Copy the code there and submit it here:`,
      result === 'invalid' ? h(Error, {}, [
        'Your email link is invalid or out of date, please try ',
        h(Link, {href:'/signup'}, h('a', 'signing up again' )), '.'
      ]) : null,
      h(Form, {onSubmit, style: {width: '100%'}}, [
        h(Label, [
          h(Input, {
            type: 'text',
            value: key,
            onChange: e=>setKey(e.currentTarget.value)
          })
        ]),
        h(Primary, {type: 'submit', style:{justifySelf: 'right'}}, result  === 'loading' ? h(Loader) : "Confirm your email")
      ]),
    ]),
  ])
}

export default Signup
