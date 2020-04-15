import h from 'react-hyperscript'
import {useState} from 'react'

import { Narrow, Box} from '../components/Layout'
import { Input, Error, Success, Label} from '../components/Form'
import { Primary, Secondary} from '../components/Button'

import {Msg as UpdatePersonMsg} from './api/updatePerson'
import Loader from '../components/Loader'
import { useUserData } from '../src/user'
import { useRouter } from 'next/router'

export default () => {
  let {data: user} = useUserData()
  let router = useRouter()
  if(user === false) router.push('/')
  if(!user) return null
  return h(Narrow, [
    h(Box, {gap: 48}, [
    h('h2', 'Your Settings'),
    h(Box, {gap: 24}, [
      h(ChangeName, {display_name: user.display_name}),
      h('hr'),
      h('div', [
        h('h4', 'Your Email'),
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

  return h('form',{
    style: {
      display: 'grid',
      gridTemplateRows: 'auto auto',
      gridGap: 8
    },
    onSubmit: async (e:React.FormEvent)=>{
      e.preventDefault()
      setLoading(true)

      let msg:UpdatePersonMsg = {display_name: name}
      await fetch('/api/updatePerson', {
        method: "POST",
        body: JSON.stringify(msg)
      })
      setLoading(false)
      setEditing(false)
    }
  }, [
    h('div', {style: {
      display: 'grid',
      alignItems: 'center',
      gridTemplateColumns: 'auto auto'
    }},[
      h('h4', 'Your Name'),
      h('div', {
        style:{
          justifySelf:'end',
        }
      }, [
        editing ? h(Secondary, {
          type: 'submit',
        }, loading ? h(Loader) : 'submit') : null,
        ' ',
        loading ? null : h(Primary, {
          onClick: (e)=> {
            e.preventDefault()
            if(editing) {
              setName(props.display_name)
            }
            setEditing(!editing)
          }
        }, editing ? 'cancel': 'edit' ),
      ])
    ]),
    editing ? h(Input, {
      value: name,
      onChange: e => setName(e.currentTarget.value)
    }) : name,
  ])
}

const ChangePassword = () => {
  const [editing, setEditing] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confPassword, setConfPassword] = useState('')
  const [result, setResult] = useState<null | 'success' | 'failure' |'loading'>(null)

  return h('form', {
    style: {
      display: 'grid',
      gridGap: 16,
    },
    onSubmit: async (e:React.FormEvent) =>{
      e.preventDefault()
      setResult('loading')
      let msg:UpdatePersonMsg= {password: {old: oldPassword, new:newPassword}}
      let res = await fetch('/api/updatePerson', {
        method: "POST",
        body: JSON.stringify(msg)
      })
      if(res.status === 200) {
        setResult('success')
        setEditing(false)
      }
      else setResult('failure')
    }
  }, !editing ? [
    h('h4', 'Your password'),
    result === 'success' ? h(Success, 'success') : null,
    h(Primary, {
    onClick: e=> {
      e.preventDefault()
      setEditing(true)
    }
  }, 'Change your password')] : [
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
}
