import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'

import {colors, Mobile} from '../Tokens'
import { useUserData } from '../../src/data'
import {Primary, Secondary} from '../Button'

export default () => {
  const {data: user}= useUserData()
  return h(Header, [
    h(Link, {href: user ? '/dashboard' : '/', passHref:true}, h(Title, 'h.')),
    h(LoginButtons),
  ])
}

export const LoginButtons = () => {
  let router = useRouter()
  let {data, mutate: mutateUser} = useUserData()

  if(data === undefined) return null

  let redirect = router.pathname === '/' ? '' : '?redirect=' + encodeURIComponent(router.asPath)
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
          mutateUser(false)
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
color: #00008B;
}
`

const Header = styled('div')`
display: grid;
font-family: serif;
grid-template-columns: auto auto;
height: 32px;
padding-bottom: 64px;
${Mobile} {
  padding-bottom: 32px ;
  padding-top: 16px ;
}
`

const Title = styled('a')`
font-weight: bold;
font-size: 24px;
`
