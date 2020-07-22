import styled from '@emotion/styled'

export let TitleImg = styled('img')<{height?: number, width: number}>`
image-rendering: pixelated;
image-rendering: crisp-edges;
display: block;
border: 2px solid;
height: ${props=> props.height ? props.height +'px' : 'auto'};
width: ${props=> props.width}px;
`

export let AccentImg = styled('img')<{height?: number, width?: number}>`
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
display: block;
border: none;
height: ${props=> props.height ? props.height +'px' : '100px'};
width: ${props=> props.width ? props.width +'px' : '100px'};
`
