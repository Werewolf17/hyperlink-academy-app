import styled from '@emotion/styled'
import {colors} from './Tokens'
export const Pill = styled('span')<{borderOnly?: boolean}>`
width: fit-content;
font-weight: bold;
font-family: Roboto Mono;
padding: 2px 8px;
font-size: 0.75rem;
border-radius: 4px;
color: ${colors.textSecondary};
${props=> props.borderOnly
? `border: 2px solid ${colors.grey55};`
: `background-color: ${colors.grey90};`
}
`
