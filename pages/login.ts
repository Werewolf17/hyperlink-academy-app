import h from 'react-hyperscript'
import { useState, useEffect } from 'react'
import { NextPageContext } from 'next'
import {useRouter} from 'next/router'

import {Section} from '../components/Section'
import {getToken} from '../src/token'
import {Form, Label, Button, Input, Error} from '../components/Form'
import {Msg} from './api/login'

const Login = () => {
  let [email, setEmail] = useState('')
  let [password, setPassword] = useState('')
  let [loading, setLoading] = useState(false)
  let [error, setError] = useState<'wrong username or password' | null>(null)
  let router = useRouter()

  let {redirect} = router.query

  useEffect(()=>setError(null), [email, password])

  return h(Section, {}, h(Form, {onSubmit: async (e) => {
    e.preventDefault()
    let msg:Msg = {email, password}
    setLoading(true)
    let res = await fetch('/api/login', {
      method: "POST",
      body: JSON.stringify(msg)
    })
    if(res.status === 200) {
      setLoading(false)
      window.location.assign(redirect as string || '/')
    }
    else {
      setLoading(false)
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
    loading ? h('p', 'loading') : h(Button, {type: 'submit'}, 'login')
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
