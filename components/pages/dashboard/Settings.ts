import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useState } from 'react'

import { Box, LabelBox, FormBox} from 'components/Layout'
import { Input, Textarea, Info } from 'components/Form'
import { Primary, Destructive } from 'components/Button'
import { colors } from 'components/Tokens'

import { callApi, useApi } from 'src/apiHelpers'
import { UpdatePersonMsg, UpdatePersonResult } from 'pages/api/people/[id]'
import { GETConnectStripeResult } from 'pages/api/user/connectStripe'

const COPY = {
  usernameField: "Username",
  emailField: "Email",
  pronounsField: "Your Pronouns",
  displayNameField: "Nickname",
  displayNameDescription: "This is displayed when you post on the forum or enroll in a course.",
  linkField: "Link",
  linkDescription: "Where you're hanging on the internet (your website, Twitter, etc.)",
  bioField: "Bio"
}

type Profile = {
  bio: string,
  display_name: string,
  pronouns: string,
  link: string,
  stripe_connected_accounts:{
    stripe_account: string,
    payouts_enabled: boolean,
    connected: boolean
  } | null
}
const Settings = (props:{
  user: {email: string, username: string}
  facilitator: boolean,
  profile: Profile
  mutate: (p:Omit<Profile, 'stripe_connected_accounts'>)=>void
}) => {
  let [formData, setFormData] = useState(props.profile)
  let [status, callUpdatePerson] = useApi<UpdatePersonMsg, UpdatePersonResult>([])


  const changed =
    formData.bio !== props.profile.bio ||
    formData.display_name !== props.profile.display_name ||
    formData.link !== props.profile.link ||
    formData.pronouns !== props.profile.pronouns

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!changed) return
    let res = await callUpdatePerson(`/api/people/${props.user.username}`, {profile:formData})
    if(res.status === 200) {
      props.mutate(formData)
    }
  }
  console.log(props.profile)

  return h(Box, {gap:64}, [
    h(FormBox, {onSubmit, width: 400, gap: 32}, [
      h(Box, {gap:8}, [h('h4', 'Username'), h(Info, props.user.username)]),
      h(Box, {gap:8}, [h('h4', 'Email'), h(Info, props.user.email)]),
      h(LabelBox, {gap:8}, [
        h('div', [
          h('h4', COPY.displayNameField),
          h(Description, COPY.displayNameDescription)
        ]),
        h(Input,{
          value: formData.display_name,
          onChange: e=>{
            e.preventDefault()
            setFormData({...formData, display_name: e.currentTarget.value})
          }
        })
      ]),
      h(LabelBox, {gap:8}, [
        h('h4', COPY.pronounsField),
        h(Input,{
          value: formData.pronouns,
          onChange: e=>{
            e.preventDefault()
            setFormData({...formData, pronouns: e.currentTarget.value})
          }
        })
      ]),
      h(LabelBox, {gap:8}, [
        h(Box, {gap:4}, [
          h('h4', COPY.linkField),
          h(Description, COPY.linkDescription),
        ]),
        h(Input, {
          value: formData.link,
          onChange: e=>setFormData({...formData, link: e.currentTarget.value})
        })
      ]),
      h(LabelBox, {gap:8}, [
        h('h4', COPY.bioField),
        h(Textarea, {
          value: formData.bio,
          onChange: e=>setFormData({...formData, bio: e.currentTarget.value})
        })
      ]),
    h(SubmitButtons, [
      h(Destructive, {disabled: !changed, onClick: ()=>{
        if(!props.profile) return
        setFormData(props.profile)
      }}, "Discard Changes"),
      h(Primary, {status, type: 'submit', disabled: !changed}, 'Save Changes')
    ])
  ]),
    !props.facilitator ? null : h(StripeSettings, {stripe_connected_accounts: props.profile.stripe_connected_accounts})
  ])
}

const StripeSettings = (props:{stripe_connected_accounts: {connected: boolean, payouts_enabled:boolean} | null}) => {
  let [status, setStatus] = useState<'normal' | 'loading'>('normal')
  console.log(props)
  return h(Box, [
      h('h3', {id:"connect-stripe"}, 'Link a Stripe account'),
      h(Primary, {status, onClick: async ()=> {
        setStatus('loading')
        let res = await callApi<null, GETConnectStripeResult>('/api/user/connectStripe')
        if(res.status !== 200) return setStatus('normal')
        window.location.assign(res.result.url)
      }}, !props.stripe_connected_accounts?.connected
        ? 'Connect to Stripe'
        : props.stripe_connected_accounts.payouts_enabled ? 'Update your Stripe details' : "Finish your Stripe onboarding")
    ])
}

export default Settings

const Description = styled('p')`
font-size: 0.75rem;
font-weight: normal;
color: ${colors.textSecondary};
`

const SubmitButtons = styled('div')`
justify-self: right;
display: grid;
grid-template-columns: auto auto;
grid-gap: 16px;
`
