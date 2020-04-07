import styled from "styled-components"
import h from 'react-hyperscript'

import { colors, Gap} from '../Layout'
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
  }, h(Gap, {gap: 16}, [
    h('h3', props.name),
    h('p', props.description),
    h('p', 'Next instance starts ' + props.start_date.toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}))
  ]))
}

let Card = styled('a')`
width: 300px;
box-sizing: border-box;
background-color: ${colors.grey15};
padding: 24px;
color: white;

&:hover, &:active, &:focus {
cursor: pointer;
box-shadow: 3px 3px white, 7px 7px ${colors.grey15};
}
`
