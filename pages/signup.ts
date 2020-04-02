import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import {useRouter} from 'next/router'

import {Form, Label, Input, Error, Submit} from '../components/Form'
import {Primary} from '../components/Button'
import TitleImg from '../components/TitleImg'
import { useUserContext } from './_app'

const Signup = () => {
  let [formState, setFormState] = useState({email:'', password:'', confPassword:''})
  let [error, setError] = useState<'user exists' | null>(null)
  let [state, setState] = useState<'normal' | 'loading' | 'success'>('normal')
  let router = useRouter()
  let user = useUserContext()

  if(user) router.push('/')

  useEffect(()=>{
    setError(null)
  }, [formState.email])

  if(state === 'success') {
    return h('div', [
      `Sweet! We sent an email to ${formState.email}, click the link there to confirm your account! If you aren't seeing
it, check out your Spam folder.`
    ])
  }

  const onSubmit = async (e:React.FormEvent) => {
      e.preventDefault()
      setState('loading')
      let res = await (await fetch('/api/signup', {
        method: "POST",
        body: JSON.stringify({email:formState.email, password: formState.password})
      })).json()

      if(!res.success) {
        setState('normal')
        setError('user exists')
      }
      else {
        setState('success')
      }
    }

  return h('div', {}, [
    h(Form, {onSubmit}, [
      h(TitleImg, {src: '/img/start_journey.png', width: '250px'}),
      h('h1', 'Start a journey'),
      error ? h(Error, error) : null,
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
