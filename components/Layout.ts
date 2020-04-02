import styled from 'styled-components'
import {Login} from './Login'
import Head from 'next/head'
import Link from 'next/link'
import h from 'react-hyperscript'

export const colors = {
  grey95: "#F2F2F2",
  grey55: "#8C8C8C",
  grey15: "#272727",
  backgroundRed: "#F9EBE8",
  accentRed: "#C23C1E"
}

const Layout:React.SFC = (props)=>{
  return h(Main, [
    h(Head, {children:[]}, [
      h('link', {href:"https://fonts.googleapis.com/css?family=Lato&display=swap",  rel:"stylesheet"})
    ]),
    h(Header, [
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
`

const Title = styled('div')`
font-weight: bold;
font-size: 24px;
`

const Main = styled('div')`
font-size: 16;
font-family: 'Lato', sans-serif;

a:visited {
  color: blue;
}

h1, h2 {
font-family: monospace;
margin: 0;
font-weight: normal;
}
`

const Body = styled('div')`
max-width: 800px;
padding: 64px 32px;
margin: auto;
`

