import h from 'react-hyperscript'
import styled from 'styled-components'

import { Box, colors } from '../../components/Layout'
import Enroll from '../../components/Course/Enroll'
import {CourseData, getCourseData} from '../../src/course'

import Description from '../../writing/courses/meta/description.mdx'

export default (props:CourseData) => {
  let start_date = new Date(props.course_instances[0].start_date)
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  return h(Box, {gap: 48}, [
    h(Box, {gap: 8}, [
      h('h1', 'The Meta Course'),
      h('a',{href:'https://forum.hyperlink.academy/c/courses/the-meta-course'},  'Check out the course forum')
    ]),
    h(Main, [
      h(Box,{gap:16}, [
        h(Description),
        props.course_instances[0].people_in_instances[0] ? null : h('h3', `The next instance starts ${start_date}`),
         h(Enroll, {instances: props.course_instances}),
      ]),
      h(Info,[
        h(Box, {gap:16}, [
          h(Cost, '$' + props.cost),
          h('b', '2 weeks'),
          h('hr'),
          h('p', ``)
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

export const getServerSideProps = getCourseData('meta')
