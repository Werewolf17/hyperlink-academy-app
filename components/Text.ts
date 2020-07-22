import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Markdown from 'react-markdown'
import {colors} from './Tokens'

export default (props:{source:string}) => h(TextStyles, {}, h(Markdown, props))
export const TextStyles = styled('div')`

h1:first-of-type { margin-top: 0 !important; margin-left: 0 !important; }

h1 {
  margin-top: 2.75rem;
  margin-bottom: .5rem;
  font-family: 'Lato', sans-serif;
  font-weight: bold;
  font-size: 1.8rem;

}

h2 {
  margin-top: 1.75rem;
  margin-bottom: .75rem;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.35rem; 
  font-kerning: normal;
}

h3 {
  margin-top: 1.25rem;
  margin-bottom: .6rem;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.25rem;
  font-kerning: normal;


}

h4 {
  margin-top: 1.5rem;
  margin-bottom: .6rem;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  font-kerning: normal;
  color: ${colors.textSecondary};
}


p {
  margin-bottom: 1rem;
  margin-top: 0;
  font-size: 1rem;
  line-height:165%;
  font-kerning: normal;

}

li {
  margin-bottom: 8px;
  margin-top: 8px;
  font-size: 1rem;
  line-height: 155%;

}
pre { 
  white-space: pre-wrap; 
  font-family: 'Roboto Mono', monospace;
  background-color: ${colors.grey95};
  color: ${colors.textSecondary};
  border-radius: 2px;
  padding: 16px;  
}
`
