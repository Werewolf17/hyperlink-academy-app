import styled from '@emotion/styled'
import {colors, Mobile} from 'components/Tokens'

export const Card = styled('a')`
box-sizing: border-box;
padding: 16px;
background-color: white;
border: 1px solid;
border-color: ${colors.grey15};
text-decoration: none;

color: ${colors.textPrimary};

&:visited {
color: inherit;
}

&:hover, &:active, &:focus {
cursor: pointer;
transform: translate(-4px, -4px);
box-shadow: 4px 4px ${colors.grey15};
color: inherit;
}
`

export const FlexGrid= styled('div')<{min: number, mobileMin: number}>`
width: 100%;
display: grid;
grid-template-columns: repeat(auto-fill, minmax(${props=>props.min}px, 1fr));

${Mobile} {
grid-template-columns: repeat(auto-fill, minmax(${props=>props.mobileMin}px, 1fr));
}
grid-gap: 32px;
`
