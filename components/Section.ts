import h from 'react-hyperscript'
import styled from 'styled-components'
export const Section:React.SFC<{legend?: string}> = (props) => {
  return h(FieldSet, {}, [
    props.legend ?h(Legend, props.legend) : null,
    h('div', [props.children])
  ])
}

const Legend = styled('legend')`
font-size: 1.2em;
`

const FieldSet = styled('fieldset')`
padding: 5px;
border: 2px solid;
box-shadow: 5px 5px lightblue;
margin: auto;
margin-bottom: 25px;
`
