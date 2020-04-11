import h from 'react-hyperscript'
import styled from 'styled-components'

import { Box, colors } from '../../components/Layout'
import Enroll from '../../components/Course/Enroll'
import {CourseData, getCourseData} from '../../src/course'

import Description from '../../writing/courses/meta/description.mdx'

export default (props:CourseData) => {
  return h(Box, {gap: 48}, [
    h(Box, {gap: 8}, [
      h('h1', 'The Meta Course'),
      h('a',{href:'https://forum.hyperlink.academy/c/courses/the-meta-course'},  'Check out the course forum')
    ]),
    h(Main, [
      h(Box,{gap:16}, [
        h(Description),
         h(Enroll, {instances: props.course_instances}),
      ]),
      h(Info,[
        h(Box, {gap:16}, [
          h(Cost, '$' + props.cost),
          h('b', '2 weeks'),
        ])
      ])
      
    ])
  ])
}

const Info = styled('div')`
padding: 24px;
width: 240px;
box-sizing: border-box;
background-color: ${colors.grey95};
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

const Main = styled('div')`
display: grid;
grid-template-columns: auto auto;
grid-gap: 24px;
`

export const getStaticProps = getCourseData('meta')
