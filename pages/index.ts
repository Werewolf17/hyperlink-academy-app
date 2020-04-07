import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage, GetServerSideProps} from 'next'
import Link from 'next/link'

import Intro from '../copy/Intro.mdx'
import { Primary, Secondary } from '../components/Button'
import CourseCard from '../components/Course/CourseCard'
import {colors, Box} from '../components/Layout'
import { useUserContext } from './_app'
import { PrismaClient, coursesGetPayload, course_instances } from '@prisma/client'
import { getToken } from '../src/token'

type CourseWithInstances = coursesGetPayload<{include: {course_instances: true}}>
type Instances = course_instances

type Props = {
  courses: CourseWithInstances[],
  instances: Instances[]
}

const Landing:NextPage<Props> = (props) => {
  let user = useUserContext()
  return h(Box, {gap:48}, [
    !user ? h(Welcome)
      : h(Box, [
        h('h1', `Hello ${user.email}!`),
        h(Box, [
          h(Link, {href: '/manual'}, h('a', 'Read the manual ➭' )),
          h('a', {href: 'https://forum.hyperlink.academy'},'Check out the forum')
        ])
      ]),
    ! user ? null : h(Box, [
      h('h2', "Your Courses"),
      h(CoursesGrid, {}, props.instances.map(instance => {
        return h(CourseCard, {
          description: '',
          start_date: new Date(instance.start_date),
          name: instance.course,
          path: '/courses/' +instance.course
        })
      }))
    ]),
    h('hr'),
    h(Box, {gap: 16}, [
      h('h2', "The Courses List"),
      h(CoursesGrid,
        props.courses
        .map(course => {
          return h(CourseCard, {
            key: course.id,
            description: course.description,
            start_date: new Date(course.course_instances[0].start_date),
            name: course.id,
            path: '/courses/' + course.id}, [])
        })),
    ]),
    h('hr'),
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

export const getServerSideProps:GetServerSideProps = async ({req}) => {
  let prisma = new PrismaClient()
  let user = getToken(req)
  let instances
  if(user) {
    instances = await prisma.course_instances.findMany({
      where: {
        people_in_instances: {
          some: {
            person_id: user.id
          }
        }
      }
    })
  }

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
  await prisma.disconnect()

  return {props: {courses, instances: instances || null}}
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
