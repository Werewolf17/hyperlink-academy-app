import h from 'react-hyperscript'
import { NextPage} from 'next'
import Intro from '../copy/Intro.mdx'

import {Section} from '../components/Section'

type Course = {
  name: string,
  description: string,
  path: string
}

const Landing:NextPage<{courses:Course[]}> = () => {
  return h('div', [
    h(Intro),
    h(Section, {legend: 'Courses'},[
      h('a', {href:'/propose'}, 'propose your own course'),
      h('ul',
        courses
        .map(course => {
          return h('li', {key: course.path}, [
            h('h4', {}, [
              h('a', {href: course.path}, course.name),
            ]),
            h('div', course.description),
          ])
        }))
    ])
  ])
}

const courses:Course[] = [
  {
    path: 'courses/internet-homesteading',
    name: "Internet Homesteading",
    description: 'Build a home for yourself on the internet.'
  }
]

export const getServerSideProps = () => {
  return {props: {courses: []}}
}

export default Landing
