import h from 'react-hyperscript'
import styled from 'styled-components'
import fetch from 'isomorphic-unfetch'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {Primary, Secondary} from './Button'
import {colors} from './Tokens'
import { useUserData } from '../src/user'

export const Login = () => {
  let router = useRouter()
  let {data, mutate} = useUserData()

  if(data === undefined) return null

  let redirect = router.pathname === '/' ? '' : '?redirect=' + encodeURIComponent(router.pathname)
  if(!data) return h(Container, {}, [
    h(Link, {href: '/signup'}, h(Primary,  'Sign up')),
    h(Link, {href: '/login' + redirect}, h(Secondary, "Log in")),
  ])
  else {
    return h(Container, [
      h(Link, {href: '/settings', passHref:true}, h(NavLink, 'settings')),
      ' ',
      h(NavLink, {onClick: async (e)=>{
        e.preventDefault()
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

const NavLink = styled('a')`
font-family: 'Roboto Mono', monospace;
text-decoration: none;
color: ${colors.textSecondary};

&:visited {
color: ${colors.textSecondary};
}
&:hover {
cursor: pointer;
}
`
