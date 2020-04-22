import h from 'react-hyperscript'
import styled from 'styled-components'
import { NextPage } from 'next'
import Link from 'next/link'

import Intro from '../writing/Intro.mdx'
import CourseCard, {CourseGrid} from '../components/Course/CourseCard'
import {colors} from '../components/Tokens'
import { MediumWidth, Box } from '../components/Layout'
import { useCourses, useUserData } from '../src/user'
import { useRouter } from 'next/router'
import TitleImg from '../components/TitleImg'
import { useEffect } from 'react'

const Landing:NextPage = () => {
  let {data: courses} = useCourses()
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
          h(Link, {href: '/manual'}, h('a', 'Read the manual ➭' )),
          h('a', {href: 'https://forum.hyperlink.academy'}, 'Check out the forum')
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
                                start_date: new Date(course.course_instances[0].start_date),
                                name: course.id,
                              }, [])
                            })),
      ]),
      h(Box, {gap: 16, style:{backgroundColor: colors.grey95, padding: 24}}, [
        h('h2', 'The Course Kindergarten'),
        'The course kindergarten is where we grow new courses. Check out some in development, or propose your own!',
        h('a', {style: {justifySelf: 'end'}, href: 'https://forum.hyperlink.academy/c/course-kindergarten/'},'Check out the kindergarten ➭')
      ]),
    ])
  ])
}

const Welcome = ()=>{
  return h(Box, {gap:32, style:{paddingBottom: '48px'}}, [
    h(ImageContainer, [
      h(TitleImg, {src:'/img/landing.png', style: {border: 'none'}}),
    ]),
    h(Title, 'hyperlink.academy'),
    h(Intro),
  ])
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
