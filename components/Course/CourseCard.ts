import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'

import {Pill} from '../Pill'
import { colors, Mobile} from '../Tokens'
import Card  from '../Card'
import { prettyDate } from '../../src/utils'

type Props = {
  name:string,
  description: string
  slug: string,
  id: number,
  card_image: string,
  status?:  'draft' | 'live' | null
  course_cohorts:{start_date: string}[]
}

export default (props:Props) => {
  let upcomingCohort = props.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]

  return h(Link, {
    href: '/courses/[slug]/[id]',
    as: `/courses/${props.slug}/${props.id}`,
    passHref: true}, h(CourseCard, {
  }, [
    h(ImageContainer, [
      props.status === 'draft' ? null : h(Image, {src: props.card_image}),
    ]),
    h(CardContent, [
      h('h3', props.name),
      h('p', {style: {overflow: 'hidden', height: '100%'}}, props.description),
      props.status === 'draft' ? h(Pill, {red: true, borderOnly: true}, 'draft')
        : !upcomingCohort ? null : h(DateContainer, ('Next cohort starts ') + prettyDate(upcomingCohort?.start_date))
    ])
  ]))
}

const CardContent = styled('div')`
display: grid;
padding: 16px;
grid-gap: 16px;
grid-template-rows: min-content auto 22px;
height: 100%;
box-sizing: border-box;
`

const Image = styled('img')`
image-rendering: pixelated;
image-rendering: crisp-edges;
height: 100%;
`

const ImageContainer = styled('div')`
width: auto;
height: 272px;
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
