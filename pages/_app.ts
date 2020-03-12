import NextApp, { AppContext } from 'next/app'
import h from 'react-hyperscript'
import Head from 'next/head'
import Link from 'next/link'
import styled from 'styled-components'
import {getToken} from '../src/token'
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
  username: string
}

export default class App extends NextApp<Props> {
  static async getInitialProps(appContext:AppContext) {
    let {req} = appContext.ctx
    const appProps = await NextApp.getInitialProps(appContext)
    let username
    if(req) {
       username = getToken(req)
    }
    else {
      username = localStorage.getItem('username')
    }
    if(username) return {...appProps, loggedIn: true, username}
    return {...appProps, loggedIn: false}
  }
  componentDidMount(){
    if(this.props.loggedIn) {
      localStorage.setItem('username', this.props.username)
    }
    else {
      localStorage.removeItem('username')
    }
  }
  render() {
    const { Component, pageProps, loggedIn, username} = this.props
    return h(Layout, {}, [
      h(Head, {children:[ h('title', 'hyperlink.academy')]}),
      h(Header, [
        h('h1', {}, h(Link, {href:'/'}, h("a", 'hyperlink.academy'))),
        h(Login, {loggedIn, username}),
      ]),
      h(Component, {...pageProps, loggedIn}),
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

