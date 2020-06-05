import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'

import { Box} from '../Layout'
import { colors, Mobile} from '../Tokens'
import Card  from '../Card'

type Props = {
  name:string,
  description: string
  id: string,
  href?:string,
  start_date?: Date
  cohort?: boolean
}
export default (props:Props) => {
  return h(Link, {
    href: props.href ? props.href : '/courses/[id]',
    as: props.href ? props.href : '/courses/' + props.id,
    passHref: true}, h(CourseCard, {
  }, [
    h(ImageContainer, [
      h(Image, {src: `/img/courses/${props.id}.png`}),
    ]),
    h(Box, {padding: 16, gap:32}, [
      h(Box, {gap: 16, style: {minHeight: 152}}, [
        h('h3', props.name),
        h('p', props.description),
      ]),
      !props.start_date ? null : h(DateContainer, (props.cohort ? 'starts ' : 'Next cohort starts ') + props.start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}))
    ])
  ]))
}

const Image = styled('img')`
image-rendering: pixelated;
image-rendering: crisp-edges;
height: 100%;
`

const ImageContainer = styled('div')`
width: 120px;
height: auto;
overflow: hidden;
max-height: 272px;
object-fit: none;
border-right: 2px solid;
${Mobile} {
display: none;
}
`

let DateContainer = styled('p')`
color: ${colors.textSecondary};
font-size: 12px;
`

let CourseCard = styled(Card)`
padding: 0px;
display: grid;
border: 2px solid;
border-radius: 2px;
grid-template-columns: 120px auto;
max-height: 280px;
${Mobile} {
grid-template-columns: auto;
}
`

export const FlexGrid= styled('div')<{min: number, mobileMin: number}>`
width: 100%;
display: grid;
grid-template-columns: repeat(auto-fill, minmax(${props=>props.min}px, 1fr));

${Mobile} {
grid-template-columns: repeat(auto-fill, minmax(${props=>props.mobileMin}px, 1fr));
}
grid-gap: 32px;
`
