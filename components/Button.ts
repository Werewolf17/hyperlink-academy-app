import styled from "@emotion/styled";
import h from 'react-hyperscript'
import {colors} from  './Tokens'
import {Status} from '../src/apiHelpers'
import { Checkmark } from "./Icons";
import Loader from "./Loader";
import { ReactElement } from "react";
import Link from 'next/link'

export const Primary:React.SFC<{disabled?:boolean, status?:Status}&Parameters<typeof PrimaryButton>[0]> =  (props)=>{
  let displayComponent = {
    success: Checkmark,
    loading: h(Loader),
    error: props.children as ReactElement,
    normal: props.children as ReactElement
  }
  return h(PrimaryButton, {...props, success: props.status==='success'}, displayComponent[props.status || 'normal'])
}
const PrimaryButton = styled('button')<{disabled?: boolean, success?:boolean}>`
font-family: Roboto Mono;
font-size: inherit;
height: fit-content;
width: fit-content;
background-color: ${colors.grey15};
color: white;

border: 2px solid;
border-color: ${colors.grey15};
border-radius: 2px;

padding: 6px 14px;
text-decoration:none;
&:visited {color: white;}
&:hover {
cursor: pointer;
}

${props => {
if(props.disabled) return `
border-color: ${colors.grey80};
background-color: ${colors.grey80};
color: ${colors.grey55};
`}}

${props => {
if(props.success) return `
background-color: ${colors.grey15};
border-color: ${colors.accentSuccess};
`}}
`


export const Secondary = styled(Primary)<{disabled?:boolean, success?:boolean}>`
color: black;
background-color: white;

${props => {
if(props.disabled) return `
border-color: ${colors.grey80};
color: ${colors.grey55};
`}}

${props => {
if(props.success) return `
border-color: ${colors.accentSuccess};
`}}
`

export const Destructive = styled(Secondary)`
color: ${colors.accentRed};
border-color: ${colors.accentRed};

${props => {
if(props.disabled) return `
border-color: ${colors.grey80};
color: ${colors.grey55};
`}}
`

export const LinkButton = styled('a')`
color: blue;
text-decoration: underline;
font-family: 'Roboto Mono', monospace;

&:hover {
cursor: pointer;
}
`

export const BackButton:React.FC <{href:string, as?:string, shallow?:boolean}> = (props) => {
    return  h('div.textSecondary', [
        '⇠ ' , 
        h(Link, {href: `${props.href}`, as:props.as, shallow:props.shallow}, 
            h('a.notBlue', [
                'Back to ',
                props.children
            ]) 
        )
        //capitalize the first letter of the page name
    ])
}
