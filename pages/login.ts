import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'

import {Section} from '../components/Section'
import {getToken} from '../src/token'
import {Form, Label, Button, Input, Error} from '../components/Form'

const Login = () => {
  let [email, setEmail] = useState('')
  let [password, setPassword] = useState('')
  let [error, setError] = useState<'wrong username or password' | null>(null)

  useEffect(()=>setError(null), [email, password])

  return h(Section, {}, h(Form, {onSubmit: async (e) => {
    e.preventDefault()
    let res = await fetch('/api/login', {
      method: "POST",
      body: JSON.stringify({email, password})
    })
    if(res.status === 200) {
      window.location.assign('/')
    }
    else {
      setError('wrong username or password')
    }
  }}, [
    error ? h(Error, error) : null,
    h(Label, [
      h(Input, {type: 'email', placeholder: 'email',
                  value: email,
                  onChange: (e)=> setEmail(e.currentTarget.value)})
    ]),
    h(Label, [
      h(Input, {type: 'password', placeholder: 'password',
                 value: password,
                  onChange: (e)=> setPassword(e.currentTarget.value)})
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
