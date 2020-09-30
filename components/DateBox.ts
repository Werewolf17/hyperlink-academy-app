import h from 'react-hyperscript'
import styled from '@emotion/styled'
export function DateBox(props:{date: Date}) {
  return h(Container, [
    h('b', props.date.toLocaleDateString([], {month: 'short'}).toUpperCase()),
    h('h2', props.date.getDate()),
    h('small', props.date.toLocaleTimeString([], {hour: "numeric", minute: "2-digit", hour12: true}))
  ])
}

const Container = styled('div')`
h2 {
    line-height: 100%;
}
width: 80px;
display: grid;
grid-gap: 4px;
box-sizing: border-box;
padding: 8px 4px;
border: 1px solid;
text-align: center;
background-color: white;
height: min-content;
`
