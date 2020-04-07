import styled from "styled-components"
import h from 'react-hyperscript'

import { colors, Box} from '../Layout'
import { useRouter } from "next/router"

type Props = {
  name:string,
  description: string
  path: string
  start_date: Date
}
export default (props:Props) => {
  let router = useRouter()
  return h(Card, {
    onClick: ()=>{
      router.push(props.path)
    }
  }, h(Box, {gap: 16}, [
    h('h3', props.name),
    h('p', props.description),
    h(DateContainer, 'Next instance starts ' + props.start_date.toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}))
  ]))
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

&:hover, &:active, &:focus {
cursor: pointer;
}
`
