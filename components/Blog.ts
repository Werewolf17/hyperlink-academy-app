import h from 'react-hyperscript'
import {Box} from './Layout'
import { BlogTextStyles } from './BlogText'
import { BackButton } from './Button'

type Props = {
  title: string,
  description: string,
  date: string,
  author: string
}

export const BlogLayout:React.FC<Props> = (props) =>{
  return h(Box, {width:640}, [
    h(Box, {gap: 16}, [
      h(BackButton, {href: '/blog'}, 'Blog'),
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
