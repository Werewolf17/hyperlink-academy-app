import styled from '@emotion/styled'
import h from 'react-hyperscript'
import {colors} from './Tokens'

export let Label = styled('label')`
font-weight: bold;
display: grid;
grid-gap: 8px;
`

export let CheckBox = styled('label')`
font-weight: bold;
display: grid;
align-items: center;
grid-template-columns: 16px auto;
grid-gap: 16px;

input[type="checkbox"]:focus {
  border: 1px solid;
  outline: none;
}

input[type="checkbox"]:hover {
  border: 2px solid;
}

input[type="checkbox"] {
  appearance: none;
  position: relative;
  padding: 0;
  margin: 0;
  height: 16px;
  width: 16px;
  border: 1px solid;
  border-radius: 2px
}
input[type="checkbox"]::before {
  position: absolute;

  content: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8'
  fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4.69231L2.875
  7L7 1' stroke='black' stroke-width='2' stroke-linecap='round'
  stroke-linejoin='round'/%3E%3C/svg%3E");

  visibility: hidden; top: -5.5px;
  left: 2px;
}

input[type="checkbox"]:checked::before {
  visibility: visible;
}
input[type="checkbox"]:checked {
  border: 2px solid;
}


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
