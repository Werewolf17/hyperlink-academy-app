import h from 'react-hyperscript'
import styled from 'styled-components'
import fetch from 'isomorphic-unfetch'
import Link from 'next/link'
import { useRouter } from 'next/dist/client/router'
import { useUserContext } from '../pages/_app'


export const Login = () => {
  let router = useRouter()
  let user = useUserContext()

  if(!user) return h(Container, {}, [
    h(Link, {href: '/login'}, h('a', 'login')),
    ' or ',
    h(Link, {href: '/signup'}, h('a', 'signup')),
  ])
  else {
    return h(Container, [
      h(Link, {href: '/profile'}, h('a', user.email)),
      ' ',
      h(Button, {onClick: async ()=>{
        let res = await fetch('/api/logout')
        if(res.status === 200) {
          localStorage.removeItem('user')
          router.push('/')
        }
      }}, 'logout')
    ])
  }
}

const Container = styled('div')`
justify-self: right;
align-self: center;
`

const Button = styled('button')`
background: inherit;
font-size: inherit;
font-family: inherit;
color: blue;
text-decoration: underline;
border: none;
`
