import styled, {createGlobalStyle} from 'styled-components'
import {Login} from './Login'
import {useUserData} from '../src/user'
import Link from 'next/link'
import Head from 'next/head'
import h from 'react-hyperscript'
import { Fragment } from 'react'
import { useRouter } from 'next/router'

import {Spacing} from './Tokens'

const Layout:React.SFC = (props)=>{
  const {data: user}= useUserData()
  let router = useRouter()

  return h(Fragment, [
    h(GlobalStyles),
    h(Head, {children: []}, h('link', {
      href:"https://fonts.googleapis.com/css?family=Lato|Roboto+Mono&display=swap",
      rel:"stylesheet"
    })),
    h(Body, {}, [
    h(Header, [
      router.pathname === '/' ? h('div') : h(Title,{}, h(Link, {href: user ? '/dashboard' : '/'}, h("a", 'h.'))),
      h(Login),
    ]),
      props.children as React.ReactElement]),
  ])
}

export default Layout

const Header = styled('div')`
display: grid;
font-family: serif;
grid-template-columns: auto auto;
height: 32px;
padding-top: 32px;
padding-bottom: 64px;

@media(max-width: 640px) {
padding: 24px ;
}
`

const Title = styled('div')`
font-weight: bold;
font-size: 24px;
`

const Body = styled('div')`
max-width: 640px;
margin: auto;

@media(max-width: 640px) {
padding: 24px;
}
`

export const Narrow = styled('div')`
max-width: 400px;
margin: auto;
`

const GlobalStyles = createGlobalStyle`
html {
  overflow-y: scroll;
  line-height: 1.375;
  font-size: 16px;
  font-family: 'Lato', sans-serif;
}

a:visited {
  color: blue;
}

h1, h2 {
  font-family: 'Roboto Mono', monospace;
  font-weight: normal;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

h2 {
  font-size: 1.75rem;
}

h3 {
font-size: 1.25rem;
}

p { margin: 0; }
hr {
  width: 100%;
  color: black;
  border: 1px solid;
}
`

export const Box = styled('div')<{gap?: Spacing, mt?: Spacing}>`
display: grid;
grid-auto-rows: min-content;
margin-top: ${props => props.mt || 0}px;
grid-gap: ${props => props.gap || 16}px;
p
`
