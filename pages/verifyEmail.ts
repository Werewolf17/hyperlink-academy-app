import h from 'react-hyperscript'
import { useEffect, useState} from 'react'
import {Msg, Result} from './api/verifyEmail'
import {useRouter} from 'next/router'
import { Narrow } from '../components/Layout'
import {Error} from '../components/Form'
import Link from 'next/link'
import { Primary } from '../components/Button'

export default () => {
  let router = useRouter()
  let [result, setResult] = useState<null | 'invalid' | 'success'>(null)

  useEffect(() => {
    try {
      let key = router.query.key
      if(typeof key !== 'string') return setResult('invalid')

      let msg:Msg = {key}
      fetch('/api/verifyEmail', {method: "POST", body: JSON.stringify(msg)}).then(async (res) => {
        let result:Result = await res.json()
        if(result.success) {
          setResult('success')
        }
        else setResult('invalid')
      })
    }
    catch (e) {
      setResult('invalid')
    }
  }, [])

  useEffect(()=>{
    if(result !== 'success') return
    setTimeout(()=>{
      router.push('/')
    }, 3000)
  }, [result])

  if(result === null) return h(Narrow, [
    h('h1', "Verifying your account..."),
  ])

  if(result === 'success') return h(Narrow, [
    h('h1', "You're verified!"),
    h('p', "Click the button below if you're not redirected in a couple seconds"),
    h(Primary, {onClick: ()=> router.push('/')}, 'Back to hyperlink')
  ])

  return h(Narrow, [
    h(Error, {}, [
      'Your email link is invalid or out of date, please try ', h(Link, {href:'/signup'}, h('a', 'signing up again' )), '.'])
  ])
}
