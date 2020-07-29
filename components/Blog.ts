import h from 'react-hyperscript'
import {Children} from 'react'
import styled from '@emotion/styled'

import {Box} from './Layout'
import { BlogTextStyles } from './BlogText'
import { Tablet, colors } from './Tokens'
import { BackButton } from './Button'

type Props = {
  title: string,
  description: string,
  date: string,
  author: string
  toc?: boolean
}

export const BlogLayout:React.FC<Props> = (props) =>{
  let TOC = Children.toArray(props.children).filter(x => {
    let component = x as React.ReactElement
    let tag = component?.props?.originalType
    if(typeof tag === 'string') {
      return tag === 'h2'

    }
    return false
  }).map(x => {
    let component = x as React.ReactElement
    return h(component.props.originalType, [
      h('a.notBlue', {href: '#'+component.props.id}, component.props.children)
    ])
  })

  return h('div', [
    h(BackButton, {href:'/blog'}, "Blog"),
    h(Container, [
      h(Box, {width:640}, [
        h(Box, {gap:8},[
          h('h1', props.title),
          h('b.textSecondary', `By ${props.author} | ${props.date}`)
        ]),
        h(BlogTextStyles, [
          props.children as React.ReactElement
        ])
      ]),
      !props.toc ? null : h('div', [
        h(TOCContainer, {}, TOC)
      ])
    ])
  ])
}

let Container = styled('div')`
display: grid;
grid-gap: 64px;
grid-template-columns: auto auto;

${Tablet}{
display: block;
}
`

let TOCContainer = styled('div')`
position: sticky;
top: 32px;
display: grid;
padding-left: 32px;
padding-bottom: 16px;
border-left: 1px dashed;
text-align: left;
justify-items: left;

${Tablet} {
display: none;
}

h1 {
font-size: 1.375rem;
padding-top: 16px;
font-family: Lato;
}

h1.manual {
  font-size: 2em;
font-family: Roboto Mono;
}

h2 {
font-size: 1rem;
font-weight: normal;
padding-top: 4px;
font-family: Lato;
}

h3, h4, h5, h6 {
font-weight: normal;
font-size: 1rem;
color: ${colors.textSecondary};
}

a {text-decoration: none;}
`
