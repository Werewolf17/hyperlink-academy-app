import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import { Box, LabelBox, FormBox} from '../components/Layout'
import { Input, Textarea, Info } from '../components/Form'
import { Primary, Destructive} from '../components/Button'
import Loader from '../components/Loader'
import { colors } from '../components/Tokens'

import { useUserData } from '../src/data'
import { useApi } from '../src/apiHelpers'
import { UpdatePersonMsg, UpdatePersonResult } from './api/people/[id]'

const COPY = {
  header: "Your Settings",
  usernameField: "Username",
  emailField: "Email",
  displayNameField: "Nickname",
  displayNameDescription: "This is displayed when you post on the forum or enroll in a course.",
  linkField: "Link",
  linkDescription: "Where you're hanging on the internet (your website, Twitter, etc.)",
  bioField: "Bio"

}

const Settings = () => {
  let router = useRouter()
  let {data: user, mutate} = useUserData()
  let [formData, setFormData] = useState({
    bio: '',
    display_name: '',
    link: ''
  })
  let [status, callUpdatePerson] = useApi<UpdatePersonMsg, UpdatePersonResult>([])

  useEffect(()=> {
    if(user) setFormData({bio:user.bio || '', display_name:user.display_name || '', link: user.link || ''})
  }, [user])
  useEffect(()=> {if(user === false) router.push('/')})


  if(!user) return null

  const changed =
    formData.bio !== user.bio ||
    formData.display_name !== user.display_name ||
    formData.link !== user.link

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!changed) return
    if(!user) return
    let res = await callUpdatePerson(`/api/people/${user.username}`, {profile:formData})
    if(res.status === 200) {
      if(user) mutate({...user, ...formData})
    }
  }

  return h(FormBox, {onSubmit, width: 400, gap: 64, ma: true}, [
    h(Box, {gap: 32}, [
      h('h2', COPY.header),
      h(Box, {gap:8}, [h('h4', 'Username'), h(Info, user.username)]),
      h(Box, {gap:8}, [h('h4', 'Email'), h(Info, user.email)]),
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
    ]),
    h(SubmitButtons, [
      h(Destructive, {disabled: !changed, onClick: ()=>{
        if(user)setFormData({bio: user.bio ||'', display_name: user.display_name||'', link: user.link || ''})
      }}, "Discard Changes"),
      h(Primary, {type: 'submit', disabled: !changed},
        status === 'loading' ? h(Loader) : 'Save Changes')
    ])
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
