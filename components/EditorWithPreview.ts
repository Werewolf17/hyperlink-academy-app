import h from 'react-hyperscript'
import styled from '@emotion/styled'
import Text from './BlogText'
import {colors} from './Tokens'
import { useMediaQuery } from 'src/hooks'
import { useState } from 'react'
import { Box } from './Layout'
import { LinkButton } from './Button'

export default function(props:{value: string, onChange: (e:React.ChangeEvent<HTMLTextAreaElement>)=>void}) {
  let mobile = useMediaQuery('(max-width:640px)')
  let [mode, setMode] = useState<'edit'|'preview'>('edit')
  if(mobile) return h(Box, {gap:4}, [
    h('div', {style:{justifySelf: 'right'}}, [
      mode === 'preview'
        ? h(LinkButton, {onClick: ()=>setMode('edit')}, 'edit')
        : h(LinkButton, {onClick: ()=>setMode('preview')}, 'preview'),
    ]),
    mode === 'preview'
      ? h(Preview, {}, h(Text, {source: props.value}))
      : h(Editor, props),
  ])
  return h(EditorPreviewContainer, [
    h(Editor, props),
    h(Preview, {}, h(Text, {source: props.value}))
  ])
}
let EditorPreviewContainer = styled('div')`
display: grid;
max-width: 1200px;
grid-template-columns: 50% 50%;
`

let Editor = styled('textarea')`
box-sizing: border-box;
height: 512px;
padding: 16px;
font-inherit;
border-color: ${colors.borderColor};
resize: none;
`

let Preview = styled('div')`
overflow: scroll;
box-sizing: border-box;
padding: 16px;
font-size: 16px;
height: 512px;
background-color:${colors.grey95};
`
