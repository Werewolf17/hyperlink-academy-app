import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage} from 'next'
import Link from 'next/link'

import Intro from '../copy/Intro.mdx'
import { Primary, Secondary } from '../components/Button'
import CourseCard from '../components/Course/CourseCard'
import {colors, Gap} from '../components/Layout'
import { useUserContext } from './_app'
import { PrismaClient, coursesGetPayload } from '@prisma/client'

type CourseWithInstances = coursesGetPayload<{include: {course_instances: true}}>
const Landing:NextPage<{courses:CourseWithInstances[]}> = (props) => {
  let user = useUserContext()
  return h(Gap, {gap:64}, [
    user ? h('h1', `Hello ${user.email}!`) : h(Welcome),
    h(Gap, {gap: 16}, [
      h('h2', "Ongoing Courses"),
      h(CoursesGrid,
        props.courses
        .map(course => {
          console.log(course)
          return h(CourseCard, {
            key: course.id,
            description: course.description,
            start_date: new Date(course.course_instances[0].start_date),
            name: course.id,
            path: '/courses/' + course.id}, [])
        })),
    ]),
    h(Gap, {gap: 16}, [
      h('h2', 'The Course Kindergarten'),
      'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
      h('a', {href: 'https://forum.hyperlink.academy/c/course-kindergarten/'}, h(Primary, 'Course Kindergarten' ))
    ]),
    h('p', [
      h(Link, {href: '/manual', passHref: true}, h(ManualBlock, 'Read The Manual'))
    ])
  ])
}

const Welcome = ()=>{
  return h(Gap, {gap:32, style:{paddingBottom: '48px'}}, [
    h(Title, 'hyperlink.academy'),
    h(Intro),
    h(LoginButtons, [
      h(Link, {href: '/signup'}, h(Primary,  'Sign up')),
      h(Link, {href: '/login'}, h(Secondary, "Log in")),
    ]),
  ])
}

export const getServerSideProps = async () => {
  let prisma = new PrismaClient()
  let courses = await prisma.courses.findMany({
    include: {
      course_instances: {
        select: {
          start_date: true
        },
        orderBy: {
          start_date: "asc"
        },
        first: 1
      }
    }
  })
  return {props: {courses}}
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
`

const ManualBlock = styled('a')`
font-size: 2rem;
color: white;
&:visited {color:white;}
text-decoration: none;
display: block;
background-color: ${colors.grey15};
color: white;
width: 100%;
height: 100px;
padding: 16px;
box-sizing: border-box;

&:hover, &:active, &:focus {
cursor: pointer;
box-shadow: 3px 3px white, 7px 7px ${colors.grey15};
}
`


export default Landing
