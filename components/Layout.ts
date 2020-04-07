import styled, {createGlobalStyle} from 'styled-components'
import {Login} from './Login'
import Head from 'next/head'
import Link from 'next/link'
import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import { useUserContext } from '../pages/_app'
import { Fragment } from 'react'

export const colors = {
  grey95: "#F2F2F2",
  grey55: "#8C8C8C",
  grey15: "#272727",
  textSecondary: '#595959',
  backgroundRed: "#F9EBE8",
  accentRed: "#C23C1E"
}

export type Spacing = 0 | 8 | 16 | 24 | 32 | 48 | 64 | 256

const Layout:React.SFC = (props)=>{
  let router = useRouter()
  let user = useUserContext()

  return h(Fragment, [
    h(GlobalStyles),
    h(Head, {children:[]}, [
      h('link', {href:"https://fonts.googleapis.com/css?family=Lato&display=swap",  rel:"stylesheet"})
    ]),
    router.pathname === '/' && !user
      ? null
      : h(Header, [
        h(Title,{}, h(Link, {href:'/'}, h("a", 'hyperlink.academy'))),
        h(Login),
      ]),
    h(Body, {}, [props.children as React.ReactElement]),
  ])
}

export default Layout

const Header = styled('div')`
display: grid;
font-family: serif;
grid-template-columns: auto auto;
padding: 32px 64px 24px 64px;
border-bottom: 1px solid;
border-color: ${colors.grey55}
background-color: ${colors.grey95};

@media(max-width: 640px) {
padding: 32px 32px 24px 32px;
}
`

const Title = styled('div')`
font-weight: bold;
font-size: 24px;
`

const Body = styled('div')`
max-width: 640px;
padding: 64px 32px;
margin: auto;
`

export const Narrow = styled('div')`
max-width: 400px;
margin: auto;
`

const GlobalStyles = createGlobalStyle`
html {
line-height: 1.375;
font-size: 16px;
font-family: 'Lato', sans-serif;
}

a:visited {
  color: blue;
}

h1, h2 {
font-family: monospace;
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
  size: 2;
  border: 1px solid;
}
`

export const Box = styled('div')<{gap?: Spacing, mt?: Spacing}>`
display: grid;
margin-top: ${props => props.mt || 0}px;
grid-gap: ${props => props.gap || 16}px;
`
