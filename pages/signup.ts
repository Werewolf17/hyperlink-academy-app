import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'

import {Section} from '../components/Section'
import {getToken} from '../src/token'
import {Form, Label, Button, Input, Error} from '../components/Form'
import TitleImg from '../components/TitleImg'

const Login = () => {
  let [formState, setFormState] = useState({email:'', password:'', confPassword:''})
  let [error, setError] = useState<'user exists' | null>(null)
  let [state, setState] = useState<'normal' | 'loading' | 'success'>('normal')

  useEffect(()=>{
    setError(null)
  }, [formState.email])

  if(state === 'success') {
    return h(Section, [
      `Sweet, now just check your email to confirm your account! If you aren't seeing
it, check out your Spam folder.`
    ])
  }

  return h(Section, {}, [
    h(TitleImg, {src: '/img/start_journey.png', width: '250px'}),
    h(Form, {onSubmit: async (e) => {
      e.preventDefault()
      setState('loading')
      let res = await (await fetch('/api/signup', {
        method: "POST",
        body: JSON.stringify({email:formState.email, password: formState.password})
      })).json()

      if(!res.success) {
        setError('user exists')
      }
      else {
        setState('success')
      }
    }}, [
      h('p', `Welcome to hyperlink.academy!`),
      error ? h(Error, error) : null,
      h(Label, [
        h(Input, {type: 'email',
                  placeholder: 'email',
                  required: true,
                  value: formState.email,
                  onChange: (e)=> setFormState({...formState, email:e.currentTarget.value})})
      ]),
      h(Label, [
        h(Input, {type: 'password', placeholder: 'password',
                  required: true,
                  minLength: 8,
                  value: formState.password,
                  onChange: (e)=> setFormState({...formState, password:e.currentTarget.value})})
      ]),
      h(Label, [
        h(Input, {type: 'password', placeholder: 'confirm password',
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
      state === 'loading' ? h('div', 'Loading') : h(Button, {type: 'submit'}, 'login')
    ])
  ])
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
