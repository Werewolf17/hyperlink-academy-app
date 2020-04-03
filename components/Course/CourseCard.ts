import styled from "styled-components"
import h from 'react-hyperscript'

import {colors} from '../Layout'
import { useRouter } from "next/router"

type Props = {
  name:string,
  description: string
path: string
}
export default (props:Props) => {
  let router = useRouter()
  return h(Card, {
    onClick: ()=>{
      router.push(props.path)
    }
  }, [
    h('h3', props.name),
    h('p', props.description)
  ])
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
