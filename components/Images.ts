import styled from '@emotion/styled'
export let TitleImg = styled('img')<{height: number, width: number}>`
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
display: block;
border: 2px solid;
height: ${props=> props.height}px;
width: ${props=> props.width}px;
`

export let AccentImg = styled('img')`
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
display: block;
border: none;
height: 100px;
width: 100px;
`
