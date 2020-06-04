import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { InferGetStaticPropsType } from 'next'

import CourseCard, {FlexGrid} from '../components/Course/CourseCard'
import {colors} from '../components/Tokens'
import { Box} from '../components/Layout'
import { useUserInstances, useUserData, useCourses } from '../src/data'
import { coursesQuery } from './api/get/[...item]'
import { BigInstanceCard } from '../components/Card'
import {COPY} from './index'

type Props = InferGetStaticPropsType<typeof getStaticProps>
const Dashboard = (props:Props) => {
  let {data: user} = useUserData()
  let {data: courses} = useCourses(props)
  let {data: instances} = useUserInstances()
  let router = useRouter()

  if(!user || instances === undefined) {
    if(user === false) router.push('/')
    return null
  }

  return h(Box, {gap:48}, [
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
      h(FlexGrid, {min: 250, mobileMin:250}, instances.course_instances.map(instance => {
        let facillitating = instance.people.username === (user ? user.username : '')
        return h(BigInstanceCard, {...instance, enrolled: !facillitating, facillitating})
      }))
    ]),
    h('hr'),
    !courses ? null : h(Box, {gap: 16}, [
      h('h2', COPY.CoursesHeader),
      user.admin ? h('span', {style:{color: 'blue'}}, [
        h(Link,{href: '/courses/create'},  h('a.mono', 'Publish a New Course')),
        h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
      ]) : null,
      h(FlexGrid, {min: 328, mobileMin: 200},
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
    h(Box, { padding: 32, style:{backgroundColor: colors.grey95}}, [
      h(Box, {width: 640, ma: true}, [
        h('h2', COPY.courseGardenHeader),
        COPY.courseGardenDescription,
        h('span', {style:{color: 'blue', justifySelf: 'end'}}, [
          h('a.mono',{href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},  COPY.courseGardenLink),
          h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
        ])
      ])
    ]),
  ])
}

export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, unstable_revalidate: 1} as const
}


export default Dashboard
