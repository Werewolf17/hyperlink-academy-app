import styled from 'styled-components'
import {colors} from './Tokens'
export default styled('a')`
box-sizing: border-box;
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
