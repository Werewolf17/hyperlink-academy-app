import h from 'react-hyperscript'
import { useState } from 'react'
import { useApi } from '../src/apiHelpers'
import { NewsletterSignupMsg, NewsletterSignupResponse } from '../pages/api/signup/[action]'
import Loader from './Loader'
import { Checkmark } from './Icons'
import { LabelBox, FormBox } from './Layout'
import { Input } from './Form'
import styled from '@emotion/styled'
import { colors, Mobile } from './Tokens'
import { Secondary } from './Button'

export default () => {
	let [email, setEmail] = useState('')
  let [status, callNewsletterSignup] = useApi<NewsletterSignupMsg, NewsletterSignupResponse>([email])

  let onSubmit = (e: React.FormEvent)=>{
    e.preventDefault()
    callNewsletterSignup('/api/signup/newsletter',{email})
  }

  let ButtonText = {
    normal: 'Get Updates',
    loading: h(Loader),
    success: Checkmark,
    error: "Something went wrong!"
  }

  return h(FormBox, {onSubmit, gap: 16, style:{maxWidth: 320}}, [
    h(LabelBox, {gap:8},[
      h('div', [
        h('h4', "Get updates about new courses and more!"),
        h(Description, "We'll never spam or share your email. You can unsubscribe at any time."),
      ]),
      h(Input, {
        type: "email",
        value: email,
        onChange: e => setEmail(e.currentTarget.value)
      }),
    ]),
    h(Secondary, {type: "submit", success: status === 'success'}, ButtonText[status]),
  ])
}

const Description = styled('p')`
font-size: 0.75rem;
font-weight: normal;
color: ${colors.textSecondary};
  ${Mobile} {
    width: 100%;
    
  }
`
