import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage } from 'next'
import Link from 'next/link'

import Intro from '../writing/Intro.mdx'
import { Primary, Secondary } from '../components/Button'
import CourseCard from '../components/Course/CourseCard'
import {colors, Box} from '../components/Layout'
import { useCourses, useUserData } from '../src/user'

const Landing:NextPage = () => {
  let {data: courses} = useCourses()
  let {data: user} = useUserData()

  return h(Box, {gap:48}, [
    h(Welcome),
    h(Box, [
      h(Link, {href: '/manual'}, h('a', 'Read the manual ➭' )),
      h('a', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum'),
      !user ? null : h(Link, {href:'dashboard'}, 'See your courses ')
    ]),
    h(Box, {gap: 16}, [
      h('h2', "The Courses List"),
      !courses ? null : h(CoursesGrid,
        courses.courses
        .map(course => {
          return h(CourseCard, {
            key: course.id,
            description: course.description,
            start_date: new Date(course.course_instances[0].start_date),
            name: course.id,
            path: '/courses/' + course.id}, [])
        })),
    ]),
    h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24}}, [
      h('h2', 'The Course Kindergarten'),
      'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
      h('a', {style: {justifySelf: 'end'}, href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},'Check out the kindergarten ➭')
    ]),
  ])
}

const Welcome = ()=>{
  return h(Box, {gap:32, style:{paddingBottom: '48px'}}, [
    h(LoginButtons, [
      h(Link, {href: '/signup'}, h(Primary,  'Sign up')),
      h(Link, {href: '/login'}, h(Secondary, "Log in")),
    ]),
    h(Title, 'hyperlink.academy'),
    h(Intro),
  ])
}

const Title = styled('h1')`
font-family: serif;
text-decoration: underline;
font-weight: bold;
color: blue;
`
const LoginButtons = styled('div')`
justify-content: end;
display: grid;
grid-gap: 16px;
grid-template-columns: max-content max-content;
`

const CoursesGrid = styled('div')`
display: grid;
grid-template-columns: repeat(auto-fill, 300px);
grid-gap: 24px;
`

export default Landing
