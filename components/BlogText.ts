import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Markdown from 'react-markdown'
import {colors} from './Tokens'

export default (props:{source:string}) => h(BlogTextStyles, {}, h(Markdown, props))
export const BlogTextStyles = styled('div')`


h1 {
  margin-top: 64px;
  margin-bottom: 8px;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  font-size: 2.8rem;

}

h2 {
  margin-bottom: 1rem;
  margin-top: 2.75rem;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 2.1rem; 
  font-kerning: normal;
}

h3 {
  margin-bottom: .75rem;
  margin-top: 2.2rem;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.35rem;
  font-kerning: normal;


}

h4 {
  margin-bottom: .6rem;
  margin-top: 2rem;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.25rem;
  font-kerning: noral;
  color: ${colors.textSecondary};
}


p {
  margin-bottom: 1rem;
  margin-top: 0;
  font-size: 1.25rem;
  line-height:155%;
  font-kerning: normal;

}

li {
  margin-bottom: 8px;
  margin-top: 8px;
  font-size: 1.25rem;
  line-height:155%;

}
`
