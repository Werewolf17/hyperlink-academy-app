import styled from '@emotion/styled'
import h from 'react-hyperscript'

import {colors} from './Tokens'
const Card = styled('a')`
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
box-shadow: 4px 4px ${colors.grey15};
}
`
export default Card

export const InstanceCard = (props: {start_date: string, facillitator: string, enrolled?:true, facillitating?: true}) => {
  return h(Card, [
    h('h4', `Starts ${prettyDate(props.start_date)}`),
    h('p', {style:{color: colors.textSecondary}},
      `Facillitated by ${props.facillitator}`)
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
