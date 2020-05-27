import styled from '@emotion/styled'
import {colors} from './Tokens'

export const Text = styled('div')`
h1 {
  margin-top: 64px;
  margin-bottom: 8px;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  font-size: 2rem;
}

h2 {
  margin-top: 32px;
  margin-bottom: 8px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.375rem;

}

h3 {
  margin-top: 24px;
  margin-bottom: 8px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1rem;

}

h4 {
  margin-top: 16px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: .8rem;
  color: ${colors.textSecondary};
  text-transform: uppercase;
}

h5 {
  margin-top: 8px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: .8rem;
  color: ${colors.textSecondary};
}

h6 {
  margin-top: 8px;
  margin-bottom: 4px;
  font-family: 'Lato', sans-serif;
  font-weight: 500;
  font-size: .8rem;
  color: ${colors.textSecondary};
}

p {
  margin-bottom: 16px;
}

li {
  margin-bottom: 8px;
  margin-top: 8px;
}
`
