import styled from "styled-components"
import h from 'react-hyperscript'
import Link from 'next/link'

import { Box} from '../Layout'
import {colors} from '../Tokens'
import Card  from '../Card'

type Props = {
  name:string,
  description: string
  id: string,
  href?:string,
  start_date?: Date
  instance?: boolean
}
export default (props:Props) => {
  return h(Link, {
    href: props.href ? props.href : '/courses/[id]',
    as: props.href ? props.href : '/courses/' + props.id,
    passHref: true}, h(CourseCard, {
  }, h(Box, {gap: 16}, [
    h('h3', props.name),
    h('p', props.description),
    !props.start_date ? null : h(DateContainer, (props.instance ? 'starts ' : 'Next instance starts ') + props.start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}))
  ])))
}

let DateContainer = styled('p')`
color: ${colors.textSecondary}
font-size: 12px;
`

let CourseCard = styled(Card)`
width: 300px;
padding: 24px;
`

export const CourseGrid = styled('div')`
display: grid;
grid-template-columns: repeat(auto-fill, 300px);
grid-gap: 24px;
`
