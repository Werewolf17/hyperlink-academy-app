import styled from "@emotion/styled";
import {colors} from  './Tokens'

export const Primary = styled('button')<{disabled?: boolean}>`
font-family: Roboto Mono;
font-size: inherit;
height: fit-content;
width: fit-content;
background-color: ${colors.grey15};
color: white;
padding: 8px 16px;
border-radius: 2px;
border: none;
text-decoration:none;
&:visited {color: white;}
&:hover {
cursor: pointer;
}

${props => {
if(props.disabled) return `
background-color: ${colors.grey80};
color: ${colors.grey55};
`}}
`

export const Secondary = styled(Primary)<{disabled?:boolean}>`
border: 2px solid;
box-sizing: border-box;
border-color: ${colors.grey15};
color: black;
background-color: white;

${props => {
if(props.disabled) return `
border-color: ${colors.grey80};
color: ${colors.grey55};
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
font-family: monospace;

&:hover {
cursor: pointer;
}
`
