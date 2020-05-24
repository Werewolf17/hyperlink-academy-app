import h from 'react-hyperscript'
import Link from 'next/link'

import CourseCard, {CourseGrid} from '../components/Course/CourseCard'
import {colors} from '../components/Tokens'
import { MediumWidth, Box} from '../components/Layout'
import { useUserInstances, useUserData, useCourses } from '../src/data'
import { useRouter } from 'next/router'
import { coursesQuery } from './api/get/[...item]'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']

const Dashboard = (props:Props) => {
  let {data: user} = useUserData()
  let {data: courses} = useCourses(props)
  let {data: instances} = useUserInstances()
  let router = useRouter()

  if(!user || instances === undefined) {
    if(user === false) router.push('/')
    return null
  }

  return h(MediumWidth, {}, [
    h(Box, {gap:48}, [
      h(Box, [
        h('h1', `Hello ${user.display_name || user.username}!`),
        h(Box, [
          h('span', {style:{color: 'blue'}}, [
            h(Link,{href: '/manual'}, h('a.mono', 'Read the manual')), 
            h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
          ]),
          h('span', {style:{color: 'blue'}}, [
            h('a.mono', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum'), 
            h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭') 
          ]),
        ])
      ]),
      !instances ? null : h(Box, [
        h('h2', "Your Courses"),
        h(CourseGrid, {}, instances.course_instances.map(instance => {
          return h(CourseCard, {
            description: '',
            id: instance.id,
            href: `/courses/${instance.course}/${instance.id}`,
            start_date: new Date(instance.start_date),
            instance: true,
            name: instance.id,
          })
        }))
      ]),
      h('hr'),
      !courses ? null : h(Box, {gap: 16}, [
        h('h2', "The Courses List"),
        user.admin ? h('span', {style:{color: 'blue'}}, [
          h(Link,{href: '/courses/create'},  h('a.mono', 'Publish a New Course')), 
          h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
        ]) : null,
        h(CourseGrid,
          courses?.courses
          .map(course => {
            return h(CourseCard, {
              key: course.id,
              id: course.id,
              description: course.description,
              start_date: new Date(course.course_instances[0]?.start_date),
              name: course.name,
            }, [])
          })),
      ]),
      h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24,maxWidth: '640px' }}, [
        h('h2', 'The Course Kindergarten'),
        'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
        h('span', {style:{color: 'blue', justifySelf: 'end'}}, [
          h('a.mono',{href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},  'Check out the kindergarten'), 
          h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
        ])
      ]),
    ])
  ])
}

export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, unstable_revalidate: 1} as const
}


export default Dashboard
