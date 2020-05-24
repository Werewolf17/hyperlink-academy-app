import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useState, useEffect } from 'react'

import { Narrow, Box} from '../components/Layout'
import { Input, Textarea, Info, Label} from '../components/Form'
import { Primary, Destructive} from '../components/Button'

import {Msg, Result} from './api/updatePerson'
import Loader from '../components/Loader'
import { useUserData } from '../src/data'
import { callApi } from '../src/apiHelpers'
import { useRouter } from 'next/router'
import { colors } from '../components/Tokens'

const Settings = () => {
  let router = useRouter()
  let {data: user, mutate} = useUserData()
  let [formData, setFormData] = useState({
    bio: '',
    display_name: '',
    link: ''
  })
  let [formState, setFormState] = useState<'normal' |'loading' | 'success'>('normal')

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
    setFormState('loading')
    let res = await callApi<Msg, Result>('/api/updatePerson', {profile:formData})
    if(res.status === 200) {
      if(user) mutate({...user, ...formData})
      setFormState('success')
    }
  }

  return h(Narrow, [
    h('form', {onSubmit}, [
      h(Box, {gap: 64}, [
        h(Box, {gap: 32}, [
          h('h2', 'Your Settings'),
          h(Box, {gap:8}, [h('b', 'Username'),h(Info, user.username)]),
          h(Box, {gap:8}, [h('b', 'Email'),h(Info, user.email)]),
          h(Label, [
            'Nickname',
            h(Description, ''),
            h(Input,{
              value: formData.display_name,
              onChange: e=>{
                e.preventDefault()
                setFormData({...formData, display_name: e.currentTarget.value})
              }
            })
          ]),
          h(Label, [
            h(Box, {gap:4}, [
              'A Link',
              h(Description, "Add a link to where you're hanging on the internet (your website, twitter, etc)"),
            ]),
            h(Input, {
              value: formData.link,
              onChange: e=>setFormData({...formData, link: e.currentTarget.value})
            })
          ]),
          h(Label, [
            'Bio',
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
            formState === 'loading' ? h(Loader) : 'Save Changes')
        ])
      ])
    ]),
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
