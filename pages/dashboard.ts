import h from 'react-hyperscript'
import { NextPage } from 'next'
import Link from 'next/link'

import CourseCard, {CourseGrid} from '../components/Course/CourseCard'
import {colors} from '../components/Tokens'
import { MediumWidth, Box} from '../components/Layout'
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

  return h(MediumWidth, {}, [
    h(Box, {gap:48}, [
      h(Box, [
        h('h1', `Hello ${user.display_name ? user.display_name : ''}!`),
        h(Box, [
          h(Link, {href: '/manual'}, h('a', 'Read the manual ➭' )),
          h('a', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum')
        ])
      ]),
      !instances ? null : h(Box, [
        h('h2', "Your Courses"),
        h(CourseGrid, {}, instances.course_instances.map(instance => {
          return h(CourseCard, {
            description: '',
            id: instance.course,
            href: 'https://forum.hyperlink.academy/g/' + instance.id,
            start_date: new Date(instance.start_date),
            instance: true,
            name: instance.course,
          })
        }))
      ]),
      h('hr'),
      !courses ? null : h(Box, {gap: 16}, [
        h('h2', "The Courses List"),
        h(CourseGrid,
          courses.courses
          .map(course => {
            return h(CourseCard, {
              key: course.id,
              id: course.id,
              description: course.description,
              start_date: new Date(course.course_instances[0].start_date),
              name: course.name,
            }, [])
          })),
      ]),
      h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24,maxWidth: '640px' }}, [
        h('h2', 'The Course Kindergarten'),
        'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
        h('a', {style: {justifySelf: 'end'}, href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},'Check out the kindergarten ➭')
      ]),
    ])
  ])
}

export default Dashboard
