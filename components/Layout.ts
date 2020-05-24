import styled from '@emotion/styled'
import {css, Global} from '@emotion/core'
import {Login} from './Login'
import {useUserData} from '../src/data'
import Link from 'next/link'
import Head from 'next/head'
import h from 'react-hyperscript'
import { Fragment } from 'react'

import {Spacing, colors} from './Tokens'

const Layout:React.SFC = (props)=>{
  const {data: user}= useUserData()
  return h(Fragment, [
    h(Global, {styles: GlobalStyles}),
    h(Head, {children: []}, h('link', {
      href:"https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,400;0,700;0,900;1,400;1,700;1,900&family=Roboto+Mono:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap",
      rel:"stylesheet"
    })),
    h(Body, {}, [
    h(Header, [
      h(Title,{}, h(Link, {href: user ? '/dashboard' : '/'}, h("a", 'h.'))),
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
@media(max-width: 1016px) {
  padding-bottom: 32px ;
  padding-top: 16px ;
}
`

const Title = styled('div')`
font-weight: bold;
font-size: 24px;
`

const Body = styled('div')`
max-width: 968px;
padding-bottom: 32px;
margin: auto;

@media(max-width: 1016px) {
padding: 24px;
}
`


const GlobalStyles = css`
html {
  overflow-y: scroll;
  line-height: 1.375;
  font-size: 16px;
  font-family: 'Lato', sans-serif;
  color: ${colors.textPrimary};
}

a.notBlue {
  color: inherit;
}


a.notBlue:visited {
  color: inherit;
}

a.notBlue:hover {
  color: #00008B;
}

a.mono {
  font-family: 'Roboto Mono', mono;
}

a.notBlue:visited {
  color: inherit;
}

a.notBlue:hover {
  color: #00008B;
}


a:visited {
  color: blue;
}

a:hover {
  color: #00008B;
}

h1, h2 {
  font-family: 'Roboto Mono', monospace;
  font-weight: normal;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

h1 {
font-size:2.8rem;
font-weight: bold;
}

h2 {
  font-size: 2rem;
font-weight: bold;
}

h3 {
font-size: 1.375rem;
font-weight: 900;
}

h4 {
font-weight: 900;
}

p { margin: 0; }
hr {
  width: 100%;
  color: black;
  border: 1px solid;
}

small {
color: ${colors.textSecondary};
}
`

export const Box = styled('div')<{gap?: Spacing, mt?: Spacing, as?: string, h?:true}>`
display: grid;
${props => !props.h
? 'grid-auto-rows: min-content'
: `
grid-auto-columns: max-content;
grid-auto-flow: column;
`};
margin-top: ${props => props.mt || 0}px;
grid-gap: ${props => props.gap || 16}px;
`

export const MediumWidth = styled('div')`
max-width: 640px;
margin: auto;
`

export const Narrow = styled('div')`
max-width: 400px;
margin: auto;
`

export const Seperator = styled('hr')`
border: 1px dashed;
border-bottom: none;
color: ${colors.borderColor}
`

export const TwoColumn = styled('div')`
display: grid;
grid-template-columns: 640px 240px;
grid-gap: 64px;

@media(max-width: 1016px) {
grid-template-columns: auto;
grid-template-rows: auto auto;
}
`
