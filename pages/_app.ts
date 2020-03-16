import NextApp, { AppContext } from 'next/app'
import h from 'react-hyperscript'
import Head from 'next/head'
import Link from 'next/link'
import styled from 'styled-components'
import {getToken, Token} from '../src/token'
import {Login} from '../components/Login'

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
  user: Token
}

export default class App extends NextApp<Props> {
  static async getInitialProps(appContext:AppContext) {
    let {req} = appContext.ctx
    const appProps = await NextApp.getInitialProps(appContext)
    let user: Token | undefined
    if(req) {
       user = getToken(req)
    }
    else {
      if(localStorage.getItem('user')) user = JSON.parse(localStorage.getItem('user') || '')
    }
    if(user) return {...appProps, loggedIn: true, user}
    return {...appProps, loggedIn: false}
  }
  componentDidMount(){
    if(this.props.loggedIn) {
      localStorage.setItem('user', JSON.stringify(this.props.user))
    }
    else {
      localStorage.removeItem('user')
    }
  }
  render() {
    const { Component, pageProps, loggedIn, user} = this.props
    return h(Layout, {}, [
      //@ts-ignore
      h(Head, {}, h('title', 'hyperlink.academy')),
      h(Header, [
        h('h1', {}, h(Link, {href:'/'}, h("a", 'hyperlink.academy'))),
        h(Login, {loggedIn, username:user?.email}),
      ]),
      h(Component, {...pageProps, loggedIn, user}),
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
}

const Header = styled('div')`
display: grid;
grid-template-columns: auto auto;
`

