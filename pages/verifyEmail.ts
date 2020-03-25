import h from 'react-hyperscript'
import { useEffect, useState} from 'react'
import {Msg, Result} from './api/verifyEmail'
import {useRouter} from 'next/router'

export default () => {
  let router = useRouter()
  let [result, setResult] = useState<null | 'invalid parameters' | 'old key'>(null)

  useEffect(() => {
    try {
      let key = router.query.key
      if(typeof key !== 'string') return setResult('invalid parameters')

      let msg:Msg = {key}
      fetch('/api/verifyEmail', {method: "POST", body: JSON.stringify(msg)}).then(async (res) => {
        let result:Result = await res.json()
        if(result.success) {
          router.push('/')
        }
        else setResult('old key')
      })
    }
    catch (e) {
      setResult('invalid parameters')
    }
  }, [])

  if(!result)  return h('div', 'loading')
  if(result === 'old key') {
    return h('div', 'Your email link is out of date, please try signing up again')
  }
}
