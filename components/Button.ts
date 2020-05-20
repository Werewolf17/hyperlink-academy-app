import styled from "@emotion/styled";
import {colors} from  './Tokens'

export const Primary = styled('button')<{disabled?: boolean}>`
font-family: monospace;
font-size: 14px;
height: fit-content;
width: fit-content;
background-color: ${colors.grey15};
color: white;
padding: 8px 16px;
border-radius: 2px;
border: none;

&:hover {
cursor: pointer;
}

${props => {
if(props.disabled) return `
background-color: ${colors.grey80};
color: ${colors.grey55};
`}}
`

export const Secondary = styled(Primary)<{disabled?:boolean, red?: boolean}>`
border: 2px solid;
padding: 6px 16px;
box-sizing: border-box;
border-color: ${colors.grey15};
color: black;
background-color: white;

${props => {
if(props.disabled) return `
border-color: ${colors.grey80};
color: ${colors.grey55};
`}}

${props => {
if(props.red) return `
color: ${colors.accentRed};
border-color: ${colors.accentRed};
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
