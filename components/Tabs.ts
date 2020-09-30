import { useState, ReactElement} from 'react'
import h from 'react-hyperscript'
import styled from '@emotion/styled'

import {Box} from './Layout'
import { Mobile, colors } from './Tokens'

type Props = {
  tabs: {
    [key: string]: ReactElement | null
  }
}
export const Tabs = (props:Props) => {
  let tabs = Object.keys(props.tabs).filter(tab => props.tabs[tab] !== null)
  let [nav, setNav] = useState(tabs[0])

  return h(Box, {gap: 32}, [
    h(StickyWrapper, [
      h(Nav, tabs.map(tab => h(Tab, {
        active: nav === tab,
        onClick: ()=> setNav(tab)
      }, tab))),
    ]),
    props.tabs[nav]
  ])
}

export function VerticalTabs(props:{tabs: string[], selected: number, onChange: (tab: number)=>void}){
  return h(Box, {}, props.tabs.map((tab, index) => {
    return h(VerticalTab, {selected: index === props.selected, onClick: ()=>props.onChange(index)}, tab)
  }))
}

export const StickyWrapper = styled('div')`
position: sticky;
top: 0px;
background-color: ${colors.appBackground};
z-index: 8;

padding-top: 48px;
margin-top: -48px;

${Mobile} {
  padding-top: 16px;
  margin-top: -16px;
}
`

const Nav = styled('div')`
display: grid;
grid-gap: 32px;
grid-auto-columns: max-content;
grid-auto-flow: column;
grid-template-rows: auto;
border-bottom: 3px solid;
`

const VerticalTab = styled('div')<{selected: boolean}>`
padding-left: 12px;
box-sizing: border-box;
&:hover {
cursor: pointer;
}
${p=>p.selected ? `
color: blue;
font-weight: bold;
border-collor: blue;
padding-left: 8px;
border-left: solid 4px;
` : ""}
`

const Tab = styled('h4')<{active:boolean}>`
padding-bottom: 4px;
margin-bottom: 2px;
font-weight: bold;
z-index: 8;

&:hover {
cursor: pointer;
}


${props => props.active ? 'color: blue' : ''};
${props => props.active ? 'border-bottom: 4px solid' : ''};
`.withComponent('a')
