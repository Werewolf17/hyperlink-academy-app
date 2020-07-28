import h from 'react-hyperscript'
import Link from 'next/link'
import {Box} from './Layout'
import { BlogTextStyles } from './BlogText'

type Props = {
  title: string,
  description: string,
  date: string,
  author: string
}
export const Header = (props:Props) =>{
  return h('div', [
    h(Box, {gap: 16}, [
    h('div.textSecondary', ['<< ' , h(Link, {href: "/blog"}, h('a.notBlue', 'Back to blog'))]),
      h(Box, {gap:8},[
        h('h2', props.title),
        h('b', `By ${props.author} | ${props.date}`)
      ])
    ])
  ])
}

export const BlogLayout:React.FC<Props> = (props) =>{
  return h(Box, {width:640}, [
    h(Box, {gap: 16}, [
    h('div.textSecondary', ['<< ' , h(Link, {href: "/blog"}, h('a.notBlue', 'Back to blog'))]),
      h(Box, {gap:8},[
        h('h1', props.title),
        h('b.textSecondary', `By ${props.author} | ${props.date}`)
      ])
    ]),
    h(BlogTextStyles, [
      props.children as React.ReactElement
    ])
  ])
}
