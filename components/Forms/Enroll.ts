import h from 'react-hyperscript'
import {useState } from 'react'
import Loader from '../Loader'

import {Input, FormContainer, Button} from './Styles'
import {enrollAPI} from '../../pages/api/enroll'

type State= 'normal' | 'loading' | 'success' | 'error'

export default () => {
  const [webpage, setWebpage] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState<State>('normal')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let data = {webpage, email, name}
    setState('loading')
    let response = await enrollAPI(data)
    if(response.status === 200) setState('success')
    else setState('error')
  }

  switch(state) {
    case 'success':
      return h(FormContainer, 'Great! A real human bean will check over your application and get back to you soon :)')
    case 'normal':
      return h(FormContainer, {onSubmit}, [
        h(Input, {
          placeholder: 'your name',
          spellCheck: false,
          onChange: (e) => {
            e.preventDefault()
            setName(e.currentTarget.value)
          }
        }),
        h(Input, {
          placeholder: 'your webpage',
          type: 'url',
          spellCheck: false,
          onChange: (e) => {
            e.preventDefault()
            setWebpage(e.currentTarget.value)
          }
        }),
        h(Input, {
          placeholder: 'email',
          type: 'email',
          spellCheck: false,
          onChange: (e) => {
            e.preventDefault()
            setEmail(e.currentTarget.value)
          }
        }),
        h(Button, {type: 'submit'}, 'enroll')
      ])

    case 'error':
      return h(FormContainer, 'Oh no! Something went wrong. Please try again in a bit, or email jared(at)awarm.space')
    case 'loading':
      return h(FormContainer, {}, h(Loader))
  }
}
