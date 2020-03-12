import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'

import {Section} from '../components/Section'
import {getToken} from '../src/token'
import { useRouter } from 'next/router'
import {Form, Label, Button, Input, Error} from '../components/Form'

const Login = () => {
  let [email, setEmail] = useState('')
  let [password, setPassword] = useState('')
  let [confPassword, setConfPassword] = useState('')
  let [error, setError] = useState<'user exists' | null>(null)
  let router = useRouter()

  useEffect(()=>{
    setError(null)
  }, [email])

  return h(Section, {}, h(Form, {onSubmit: async (e) => {
    e.preventDefault()
    let res = await (await fetch('/api/signup', {
      method: "POST",
      body: JSON.stringify({email, password})
    })).json()

    if(!res.success) {
      setError('user exists')
    }
    else {
      router.push('/login')
    }
  }}, [
    h('p', `Welcome to hyperlink.academy!`),
    error ? h(Error, error) : null,
    h(Label, [
      h(Input, {type: 'email',
                placeholder: 'email',
                required: true,
                value: email,
                onChange: (e)=> setEmail(e.currentTarget.value)})
    ]),
    h(Label, [
      h(Input, {type: 'password', placeholder: 'password',
                required: true,
                minLength: 8,
                value: password,
                onChange: (e)=> setPassword(e.currentTarget.value)})
    ]),
    h(Label, [
      h(Input, {type: 'password', placeholder: 'confirm password',
                required: true,
                 value: confPassword,
                onChange: (e)=> {
                  setConfPassword(e.currentTarget.value)
                  if(e.currentTarget.value !== password) {
                    e.currentTarget.setCustomValidity('passwords do not match')
                  }
                  else {
                    e.currentTarget.setCustomValidity('')
                  }
                }
               })
    ]),
    h(Button, {type: 'submit'}, 'login')
  ]))
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
