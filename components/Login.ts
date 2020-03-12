import h from 'react-hyperscript'
import styled from 'styled-components'
import fetch from 'isomorphic-unfetch'
import Link from 'next/link'
import { useRouter } from 'next/dist/client/router'

type Props = {
  loggedIn: false
} | {
  loggedIn: true,
  username: string
}

export const Login:React.SFC<Props> = (props) => {
  let router = useRouter()
  if(!props.loggedIn) return h(Container, {}, [
    h(Link, {href: '/login'}, h('a', 'login')),
    ' or ',
    h(Link, {href: '/signup'}, h('a', 'signup')),
  ])
  else {
    return h(Container, [
      h(Link, {href: '/profile'}, h('a', props.username)),
      ' ',
      h('button', {onClick: async ()=>{
        let res = await fetch('/api/logout')
        if(res.status === 200) {
          localStorage.removeItem('username')
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
