import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage} from 'next'
import Link from 'next/link'

import Intro from '../copy/Intro.mdx'
import { Primary, Secondary } from '../components/Button'
import CourseCard from '../components/Course/CourseCard'
import { useUserContext } from './_app'

type Course = {
  name: string,
  description: string,
  path: string
}

const Landing:NextPage<{courses:Course[]}> = () => {
  let user = useUserContext()
  return h('div', [
    user ? h('h1', `Hello ${user.email}!`) : h(Welcome),
    h('br'),
    h('div', [
      h('h2', "Ongoing Courses"),
      h('br'),
      h(CoursesGrid,
        courses
        .map(course => {
          return h(CourseCard, {key: course.path, ...course})
        })),
    ]),
    h('br'),
    h('div', [
      h('h2', 'The Course Kindergarten'),
      h('p', 'Check out some course what are in development, or propose your own!'),
      h('a', {href: 'https://forum.hyperlink.academy/c/course-kindergarten/'}, h(Primary, 'Course Kindergarten' ))
    ])
  ])
}

const Welcome = ()=>{
  return h('div', [
    h(Title, 'hyperlink.academy'),
    h(Intro),
    h(LoginButtons, [
      h(Link, {href: '/signup'}, h(Primary,  'Sign up')),
      h(Link, {href: '/login'}, h(Secondary, "Log in")),
    ]),
  ])
}

const courses:Course[] = [
  {
    path: '/courses/internet-homesteading',
    name: "Internet Homesteading",
    description: 'Build a home for yourself on the internet.'
  }
]

export const getServerSideProps = () => {
  return {props: {courses: []}}
}

const Title = styled('h1')`
font-family: serif;
text-decoration: underline;
font-weight: bold;
color: blue;
`

const LoginButtons = styled('p')`
display: grid;
grid-gap: 16px;
grid-template-columns: max-content max-content;
`

const CoursesGrid = styled('div')`
display: grid;
grid-template-columns: repeat(auto-fill, 300px);
grid-gap: 24px;
justify-content: center;
`


export default Landing
