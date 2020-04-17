import h from 'react-hyperscript'
import styled from 'styled-components'
import fetch from 'isomorphic-unfetch'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUserData } from '../src/user'


export const Login = () => {
  let router = useRouter()
  let {data, mutate} = useUserData()

  if(data === undefined) return null

  if(!data) return h(Container, {}, [
    h(Link, {href: '/signup'}, h('a', 'signup')),
    h(Link, {href: '/login?redirect=' + encodeURIComponent(router.pathname)}, h('a', 'login')),
  ])
  else {
    return h(Container, [
      h(Link, {href: '/settings'}, h('a', 'settings')),
      ' ',
      h(Button, {onClick: async ()=>{
        let res = await fetch('/api/logout')
        if(res.status === 200) {
          mutate(false)
        }
      }}, 'logout')
    ])
  }
}

const Container = styled('div')`
justify-self: right;
align-self: center;
display: grid;
grid-gap: 32px;
grid-template-columns: auto auto;

animation: fadein 2s;

@keyframes fadein {
from {opacity: 0;}
to {opacity: 1;}
}
`

const Button = styled('button')`
background: inherit;
font-size: inherit;
font-family: inherit;
color: blue;
text-decoration: underline;
border: none;
&:hover {
cursor: pointer;
}
`
