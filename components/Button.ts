import styled from "styled-components";
import {colors} from  './Layout'

export const Primary = styled('button')`
font-family: monospace;
background-color: ${colors.grey15};
padding: 8px 16px;
border-radius: 2px;
width: fit-content
border: none;
font-size: 14px;
color: white;

&:hover {
cursor: pointer;
}
`

export const Secondary = styled(Primary)`
border: 2px solid;
color: black;
border-color: ${colors.grey15};
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
