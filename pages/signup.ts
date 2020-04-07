import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'

import { Narrow, Box} from '../components/Layout'
import {Form, Label, Input, Error, Submit} from '../components/Form'
import {Primary, Secondary} from '../components/Button'
import TitleImg from '../components/TitleImg'
import { useUserContext } from './_app'
import Link from 'next/link'

const Signup = () => {
  let [formState, setFormState] = useState({email:'', password:'', confPassword:''})
  let [error, setError] = useState<'user exists' | null>(null)
  let router = useRouter()
  let user = useUserContext()

  if(user) router.push('/')

  useEffect(()=>{
    setError(null)
  }, [formState.email])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    let res = await (await fetch('/api/signup', {
      method: "POST",
      body: JSON.stringify({email:formState.email, password: formState.password})
    })).json()

    if(!res.success) {
      setError('user exists')
    }
    else {
      router.push('/signup?success')
    }
  }

  const Errors: {[key in Exclude<typeof error, null>]: React.ReactElement} = {
    'user exists': h('div', [
      "A user already exists with that email. Try ", h(Link,{href:'/login'}, h('a', 'logging in')),
      '.'
    ])
  }

  if(router.query.success !== undefined) {
    return h(Narrow, [
      h(Box, {gap: 32}, [
        h(TitleImg, {src: '/img/plane.gif'}),
        h('h1', 'Verify your email'),
        h('p', [
          `Sweet! We sent an email to ${formState.email}, click the link there to verify your email address! If you aren't seeing
it, check out your Spam folder.`,
        ]),
        h(Box, {gap: 16}, [
          h(Primary, {
            onClick: onSubmit
          }, 'Send another link'),
          h(Secondary, {
            onClick: (e) => {
              e.preventDefault()
              router.push('/signup')
            }
          }, 'Change your email')
        ])
      ])
    ])
  }

  return h(Narrow, {}, [
    h(Form, {onSubmit}, [
      h(TitleImg, {src: '/img/start_journey_crop.png'}),
      h('h1', 'Start a journey'),
      error ? h(Error, {}, Errors[error]) : null,
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
        h(Primary, {type: 'submit'}, 'Submit')
      ])
    ])
  ])
}

export default Signup
