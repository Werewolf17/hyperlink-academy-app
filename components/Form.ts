import styled from '@emotion/styled'
import h from 'react-hyperscript'
import {colors} from './Tokens'

export let Form = styled('form')`
margin: 0px auto;
display: grid;
grid-gap: 32px;
`

export let Label = styled('label')`
font-weight: bold;
display: grid;
grid-gap: 8px;
`

export let Input = styled('input')`
padding: 12px 16px;
border: 1px solid;
border-color: ${colors.grey55};
font-size: inherit;
font-family: inherit;
`

export const Textarea = styled('textarea')`
padding: 12px 16px;
height: 128px;
font-family: Lato;
`

export const Error = styled('div')`
background-color: ${colors.backgroundRed};
color: ${colors.accentRed};
padding: 16px;
`

export const Info = styled('div')`
background-color: ${colors.grey95};
padding: 16px;
`

export const Select = (props: Parameters<typeof SelectEl>[0])=>{
  return h(Container, {},[
    h(SelectEl, props),
    h(Icon, {width: 18, height: 11, xmlns:"http://www.w3.org/2000/svg", fill: 'none'},
      h('path', {d: "M1 1L9 9L17 1", stroke:colors.textSecondary, strokeWidth: 2}))
  ])
}

const Container = styled('div')`
display: grid;
grid-template-columns: 100% auto;
`

const Icon = styled('svg')`
align-self: center;
margin-left: -32px;
`

const SelectEl = styled('select')`
width: 100%;
border: 1px solid;
border-color: ${colors.grey55};
font-size: inherit;

background-color: inherit;
padding: 12px 16px;
appearance: none;
`
