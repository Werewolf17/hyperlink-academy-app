import styled from '@emotion/styled'
import {Global} from '@emotion/core'
import Head from 'next/head'
import h from 'react-hyperscript'
import { Fragment } from 'react'

import { Spacing, colors, Widths, Mobile} from '../Tokens'
import {GlobalStyleSheet} from './GlobalStyleSheet'
import Header from './Header'
import Footer from './Footer'

const Layout:React.SFC = (props)=>{
  return h(Fragment, [
    h(Global, {styles: GlobalStyleSheet}),
    h(Head, {children: []}, h('link', {
      href:"https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,400;0,700;0,900;1,400;1,700;1,900&family=Roboto+Mono:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap",
      rel:"stylesheet"
    })),
    h(Body, {}, [
      h(Header, []),
      props.children as React.ReactElement,
    ]),
    h(Footer)
  ])
}

export default Layout

export const Body = styled('div')`
max-width: 968px;
width: 100%;
padding: 32px;
margin: auto;
box-sizing: border-box;

${Mobile}{
padding: 24px;
}
`


export const Box = styled('div')<{
  gap?: Spacing,
  padding?: Spacing,
  mt?: Spacing,
  as?: string,
  h?:true,
  ma?: true,
  height?: number,
  width?:Widths
}>`
display: grid;
${props=> props.width ? 'max-width:' + props.width + 'px;' : ''}
padding: ${props=> props.padding? props.padding : '0'}px;

${props => !props.h
? 'grid-auto-rows: min-content'
: `
grid-auto-columns: max-content;
grid-auto-flow: column;
`};

margin-top: ${props => props.mt || 0}px;
grid-gap: ${props => props.gap || 16}px;
${props=> props.ma ? 'margin: auto;':''}
`

export const Seperator = styled('hr')`
border: 1px dashed;
border-bottom: none;
border-right: none;
margin :0;
color: ${colors.borderColor}
`

export const TwoColumn = styled('div')`
display: grid;
grid-template-columns: 2fr 1fr;
grid-gap: 64px;

@media(max-width: 768px) {
grid-template-columns: auto;
grid-template-rows: auto auto;
}
`
