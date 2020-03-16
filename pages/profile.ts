import h from 'react-hyperscript'
import { GetServerSideProps } from 'next'
import {useState} from 'react'
import {getToken} from '../src/token'
import {Section} from '../components/Section'
import {Form, Input, Error, Success, Button} from '../components/Form'

import {Msg as PasswordMsg} from './api/changePassword'

type Props = {
  username: string
}

export default (props:Props) => {
  return h('div', [
    h('h2', 'Profile: ' + props.username),
    h(ChangePassword)
  ])
}

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [result, setResult] = useState<null | 'success' | 'failure'>(null)

  return h(Section, {legend: 'change your password'}, [
    h(Form, {
      onSubmit: async e =>{
        e.preventDefault()
        let msg:PasswordMsg = {oldPassword, newPassword}
        let res = await fetch('/api/changePassword', {
          method: "POST",
          body: JSON.stringify(msg)
        })
        if(res.status === 200) {
          setResult('success')
        }
      }
    }, [
      result ?
        result === 'success'
        ? h(Success, 'success')
        : h(Error, 'wrong password')
      : null,
      h(Input, {type: 'password',
                placeholder: 'old password',
                value: oldPassword,
                onChange: e =>setOldPassword(e.currentTarget.value)}),
      h(Input, {type: 'password',
                placeholder: 'new password',
                value: newPassword,
                onChange: e=> setNewPassword(e.currentTarget.value)}),
      h(Button, {type: 'submit'}, 'submit')
    ])
  ])
}

export const getServerSideProps:GetServerSideProps = async ({req, res}): Promise<{props:Props}>=>{
  let token = getToken(req)
  if(!token) {
    res.writeHead(301, {Location: '/login'})
    res.end()
  }

  return {props: {
    username: token as string
  }}
}
