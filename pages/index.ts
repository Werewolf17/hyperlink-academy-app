import h from 'react-hyperscript'
import styled from '@emotion/styled'
import Link from 'next/link'

import Intro from '../writing/Intro.mdx'
import CourseCard, {CourseGrid} from '../components/Course/CourseCard'
import {colors} from '../components/Tokens'
import { MediumWidth, Box } from '../components/Layout'
import { useCourses, useUserData } from '../src/data'
import { useRouter } from 'next/router'
import {TitleImg} from '../components/Images'
import { useEffect } from 'react'
import { coursesQuery } from './api/get/[...item]'


type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']

const Landing = (props:Props) => {
  let {data: courses} = useCourses(props)
  let {data: user} = useUserData()
  let router = useRouter()
  useEffect(()=>{
    if(user) router.push('/dashboard')
  }, [user])

  return h(MediumWidth, [
    h(Box, {gap:48}, [
      h(Box, [
        h(Welcome),
        h(Box, {style:{textAlign: 'right'}}, [
          h('span', {style:{color: 'blue'}}, [
            h(Link,{href: '/manual'}, h('a.mono', 'Read the manual' )), 
            h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
          ]),
          h('span', {style:{color: 'blue'}}, [
            h('a.mono', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum'), 
            h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭') 
          ]),
        ])
      ]),
      h(Box, {gap: 16}, [
        h('h2', "The Courses List"),
        !courses ? null : h(CourseGrid,
                            courses.courses
                            .map(course => {
                              return h(CourseCard, {
                                key: course.id,
                                id: course.id,
                                description: course.description,
                                start_date: new Date(course.course_instances[0]?.start_date),
                                name: course.id,
                              }, [])
                            })),
      ]),
      h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24}}, [
        h('h2', 'The Course Kindergarten'),
        'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
        h('span', {style:{color: 'blue', justifySelf: 'end'}}, [h('a.mono',{href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},  'Check out the kindergarten'), '\u00A0 ➭'])
      ]),
    ])
  ])
}

const Welcome = ()=>{
  return h(Box, {gap:32, style:{paddingBottom: '48px'}}, [
    h(ImageContainer, [
      h(TitleImg, {height: 218, width: 640, src:'/img/landing.png', style: {border: 'none'}}),
    ]),
    h(Title, 'hyperlink.academy'),
    h(Intro),
  ])
}

export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, unstable_revalidate: 1} as const
}

const ImageContainer = styled('div')`
overflow: hidden;
border: 2px solid;
@media(max-width: 600px) {
overflow: scroll;
}
`

const Title = styled('h1')`
font-family: serif;
text-decoration: underline;
font-weight: bold;
color: blue;
`

export default Landing
