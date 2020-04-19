import styled from "styled-components";
import {colors} from  './Layout'

export const Primary = styled('button')`
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
`

export const Secondary = styled(Primary)`
border: 2px solid;
border-color: ${colors.grey15};
color: black;
background-color: white;
`

export const LinkButton = styled('a')`
color: blue;
text-decoration: underline;
font-family: monospace;

&:hover {
cursor: pointer;
}
`
