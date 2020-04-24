import h from 'react-hyperscript'
import styled from 'styled-components'
import { useState, useEffect, Fragment} from 'react'

import { Narrow, Box} from '../components/Layout'
import { Input, Error, Info, Label} from '../components/Form'
import { Primary, Secondary} from '../components/Button'

import {Msg, Result} from './api/updatePerson'
import Loader from '../components/Loader'
import { useUserData } from '../src/user'
import { callApi } from '../src/apiHelpers'
import { useRouter } from 'next/router'

export default () => {
  let {data: user} = useUserData()
  let router = useRouter()
  useEffect(()=> {if(user === false) router.push('/')})

  if(!user) return null
  return h(Narrow, [
    h(Box, {gap: 48}, [
      h('h2', 'Your Settings'),
      h(Box, {gap: 24}, [
        h(ChangeName, {display_name: user.display_name}),
        h('hr'),
        h('div', [
          h('h3', 'Your Email'),
          user.email
        ]),
        h('hr'),
        h(ChangePassword)
      ]),
    ])
  ])
}

const ChangeName = (props:{display_name: string}) => {
  let [editing, setEditing] = useState(false)
  let [name, setName] = useState(props.display_name)
  let [loading, setLoading] = useState(false)

  let onSubmit = async (e:React.FormEvent)=>{
      e.preventDefault()
      setLoading(true)

    await callApi<Msg, Result>('/api/updatePerson', {display_name: name})
    setLoading(false)
    setEditing(false)
  }

  return h('form', {
    style: {
      display: 'grid',
      gridTemplateRows: 'auto auto',
      gridGap: 16
    },
    onSubmit
  }, [
    h(PropertyHeader , [
      h('h3', 'Your Name'),
      editing ? null : h('div', {
        style:{
          justifySelf:'end',
        }
      }, [
        h(Primary, {
          onClick: (e)=> {
            e.preventDefault()
            if(editing) {
              setName(props.display_name)
            }
            setEditing(!editing)
          }
        }, 'edit' ),
      ])
    ]),
    editing ? h(Fragment, [
      h(Input, {
        value: name,
        onChange: e => setName(e.currentTarget.value)
      }),
      h('div', {style:{justifySelf:'end'}}, [
        h(Secondary, {type: 'submit'}, loading ? h(Loader) : 'submit'),
        ' ',
        loading ? null : h(Primary, {onClick: ()=>{setName(props.display_name); setEditing(false)}}, 'cancel')
      ])
    ]) : name
  ])
}

const ChangePassword = () => {
  const [editing, setEditing] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confPassword, setConfPassword] = useState('')
  const [result, setResult] = useState<null | 'success' | 'failure' |'loading'>(null)

  let onSubmit = async (e:React.FormEvent) =>{
    e.preventDefault()
    setResult('loading')

    let res = await callApi<Msg, Result>('/api/updatePerson', {password: {old: oldPassword, new:newPassword}})
    if(res.status === 200) {
      setResult('success')
      setEditing(false)
    }
    else setResult('failure')
  }

  return h('form', {
    style: {
      display: 'grid',
      gridGap: 16,
    },
    onSubmit
  }, [
    h(PropertyHeader,[
      h('h3', 'Your Password'),
      h('div', {style:{justifySelf:'end'}}, [
        editing ? null :  h(Primary, {
          onClick: (e)=> {
            e.preventDefault()
            setEditing(!editing)
          }
        }, 'change' ),
      ])
    ]),
    result === 'success' ? h(Info, 'Your password has been changed!') : null,
    !editing ? null : h(Fragment,[
      result === 'failure' ? h(Error, 'Your current password is incorrect') : null,
      h(Label, [
        'Current Password',
        h(Input, {type: 'password',
                  value: oldPassword,
                  onChange: e =>setOldPassword(e.currentTarget.value)}),
      ]),
      h(Label, [
        'New Password',
        h(Input, {type: 'password',
                  value: newPassword,
                  onChange: e=> setNewPassword(e.currentTarget.value)}),
      ]),
      h(Label, [
        'Confirm New Password',
        h(Input, {type: 'password',
                  value: confPassword ,
                  onChange: e=> {
                    setConfPassword(e.currentTarget.value)
                    if(e.currentTarget.value !== newPassword) {
                      e.currentTarget.setCustomValidity('Passwords do not match')
                    }
                    else {
                      e.currentTarget.setCustomValidity('')
                    }
                  }}),
      ]),
      h('div', {style:{justifySelf:'end'}}, [
        h(Secondary, {type: 'submit'}, result === 'loading' ? h(Loader) : 'submit'),
        ' ',
        result === 'loading' ? null : h(Primary, {onClick: e=>{e.preventDefault(); setEditing(false)}}, 'cancel')
      ])
    ])
  ] )
}


const PropertyHeader = styled('div')`
display: grid;
height: 32px;
align-items: center;
grid-template-columns: auto auto;
`
