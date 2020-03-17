import h from 'react-hyperscript'
import { NextPage} from 'next'
import Intro from '../copy/Intro.mdx'
import fs from 'fs'
import matter from 'gray-matter'

import {Section} from '../components/Section'

type Course = {
  name: string,
  description: string,
  path: string
}

const Landing:NextPage<{courses:Course[]}> = (props) => {
  return h('div', [
    h(Intro),
    h(Section, {legend: 'Courses'},[
      h('ul',
        props.courses
        .map(course => {
          return h('li', {key: course.path}, [
            h('h4', {}, [
              h('a', {href: course.path}, course.name),
            ]),
            h('div', course.description),
          ])
        })),
      h('a', {href:'https://forum.hyperlink.academy/c/course-kindergarten/5'}, 'propose your own course')
    ])
  ])
}

export const getServerSideProps = () => {
  let courses = fs.readdirSync('./pages/courses').filter(file => {
    return !fs.lstatSync('./pages/courses/' + file).isDirectory()
  }).map(file => {
    let content = fs.readFileSync('./pages/courses/' + file)
    let {data} = matter(content)
    return {...data, path: '/courses/' + file.slice(0, -3)}
  })

  return {
    props: {
      courses,
    }
  }
}

export default Landing
