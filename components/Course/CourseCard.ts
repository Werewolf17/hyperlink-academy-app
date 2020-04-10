import styled from "styled-components"
import h from 'react-hyperscript'
import Link from 'next/link'

import { colors, Box} from '../Layout'

type Props = {
  name:string,
  description: string
  path: string
  start_date: Date
  instance?: boolean
}
export default (props:Props) => {
  return h(Link, {href: props.path, passHref: true}, h(Card, {
  }, h(Box, {gap: 16}, [
    h('h3', props.name),
    h('p', props.description),
    h(DateContainer, (props.instance ? 'starts ' : 'Next instance starts ') + props.start_date.toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}))
  ])))
}

let DateContainer = styled('p')`
color: ${colors.textSecondary}
font-size: 12px;
`

let Card = styled('a')`
width: 300px;
box-sizing: border-box;
border: 1px solid;
border-color: ${colors.grey15};
padding: 24px;
text-decoration: none;
color: black;

&:visited {
color: black;
}

&:hover, &:active, &:focus {
cursor: pointer;
}
`
