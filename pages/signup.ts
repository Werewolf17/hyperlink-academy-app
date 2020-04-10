import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'

import { Narrow, Box} from '../components/Layout'
import {Form, Label, Input, Error, Submit} from '../components/Form'
import {Primary, Secondary} from '../components/Button'
import TitleImg from '../components/TitleImg'
import {Msg} from './api/signup'
import Loader from '../components/Loader'

const Signup = () => {
  let [formState, setFormState] = useState({
    email:'',
    password:'',
    confPassword:'',
    display_name: ''
  })
  let [error, setError] = useState<'user exists' | null>(null)
  let [loading, setLoading] = useState(false)
  let router = useRouter()

  useEffect(()=>{
    setError(null)
  }, [formState.email])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let msg: Msg = {email:formState.email, password: formState.password, display_name:  formState.display_name}
    let res = await (await fetch('/api/signup', {
      method: "POST",
      body: JSON.stringify(msg)
    })).json()

    if(!res.success) {
      setError('user exists')
    }
    else {
      router.push('/signup?success')
    }
    setLoading(false)
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

export default Signup
