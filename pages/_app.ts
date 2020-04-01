import NextApp, { AppContext } from 'next/app'
import h from 'react-hyperscript'
import Head from 'next/head'
import Link from 'next/link'
import styled from 'styled-components'
import {getToken, Token} from '../src/token'
import {Login} from '../components/Login'
import { useEffect, useState } from 'react'

const Layout = styled('div')`
margin: auto;
max-width: 700px;
font-size: 18px;
padding: 10px;

a:visited {
  color: blue;
}
`

type Props = {
  loggedIn: boolean,
  user?: Token
  Component: any,
  pageProps: any
}

const App = ({ Component, pageProps, loggedIn, user}:Props) => {
  let [state, setState] = useState({loggedIn, user})

  useEffect(() => {
    // Update user state in local storage
    if(loggedIn) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    else {
      localStorage.removeItem('user')
    }
    setState({loggedIn, user})

    // Listen for storage events triggered from other tabs
    let listener = (e:StorageEvent) => {
      if(e.key !== 'user') return
      if(e.newValue) {
        let newUser = JSON.parse(e.newValue || '{}')
        let newLoggedIn = !!newUser
        setState({loggedIn: newLoggedIn, user: newUser})
      } else {
        setState({loggedIn: false, user:undefined})
      }
    }

    window.addEventListener('storage', listener)
    return ()=>{
      window.removeEventListener('storage', listener)
    }
  }, [loggedIn, user])

  return h(Layout, {}, [
    h(Head, {children:[]}, h('title', 'hyperlink.academy')),
    h(Header, [
      h('h1', {}, h(Link, {href:'/'}, h("a", 'hyperlink.academy'))),
      h(Login, {loggedIn:state.loggedIn, username:state.user?.email}),
    ]),
    h(Component, {...pageProps, ...state}),
    h('br'),
    h('hr'),
    h('div', {style:{textAlign: 'right'}}, [
      'a ',
      h('a', {href:"https://fathom.network"}, 'fathom'),
      ' project',
      h('br'),
    ])
  ])
}

App.getInitialProps = async (appContext:AppContext) => {
    let {req} = appContext.ctx
    const appProps = await NextApp.getInitialProps(appContext)
    let user: Token | undefined

    if(req) {
      user = getToken(req)
    }
    else {
      let storedUserData = localStorage.getItem('user')
      if(storedUserData) user = JSON.parse(storedUserData)
    }
    if(user) {
      return {...appProps, loggedIn: true, user}
    }
    else return {...appProps, loggedIn: false}
}

export default App

const Header = styled('div')`
display: grid;
grid-template-columns: auto auto;
`

