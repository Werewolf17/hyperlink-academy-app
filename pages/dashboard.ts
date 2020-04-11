import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage } from 'next'
import Link from 'next/link'

import CourseCard from '../components/Course/CourseCard'
import {colors, Box} from '../components/Layout'
import { useUserInstances, useUserData, useCourses } from '../src/user'
import { useRouter } from 'next/router'

const Dashboard:NextPage = () => {
  let {data: user} = useUserData()
  let {data: courses} = useCourses()
  let {data: instances} = useUserInstances()
  let router = useRouter()

  if(!user || instances === undefined) {
    if(user === false) router.push('/')
    return null
  }

  return h(Box, {gap:48}, [
    h(Box, [
      h('h1', `Hello ${user.display_name ? user.display_name : ''}!`),
      h(Box, [
        h(Link, {href: '/manual'}, h('a', 'Read the manual ➭' )),
        h('a', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum')
      ])
    ]),
    !instances ? null : h(Box, [
      h('h2', "Your Courses"),
      h(CoursesGrid, {}, instances.course_instances.map(instance => {
        return h(CourseCard, {
          description: '',
          start_date: new Date(instance.start_date),
          instance: true,
          name: instance.course,
          path: '/courses/' +instance.course
        })
      }))
    ]),
    h('hr'),
    !courses ? null : h(Box, {gap: 16}, [
      h('h2', "The Courses List"),
      h(CoursesGrid,
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
    h('hr'),
    h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24}}, [
      h('h2', 'The Course Kindergarten'),
      'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
      h('a', {style: {justifySelf: 'end'}, href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},'Check out the kindergarten ➭')
    ]),
  ])
}

const CoursesGrid = styled('div')`
display: grid;
grid-template-columns: repeat(auto-fill, 300px);
grid-gap: 24px;
`

export default Dashboard
