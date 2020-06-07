import {css} from '@emotion/core'
import {colors} from '../Tokens'
export const GlobalStyleSheet = css`
.textSecondary { color: ${colors.textSecondary} };
.bgtextSecondary { background-color: ${colors.textSecondary} };
.accentSuccess { color: ${colors.accentSuccess} };
.accentRed { color: ${colors.accentRed} };

html {
  overflow-y: scroll;
  overflow-x: hidden;
  line-height: 1.375;
  font-size: 16px;
  font-family: 'Lato', sans-serif;
  color: ${colors.textPrimary};
  scroll-behavior: smooth;
}

body {
}

a.notBlue {
  color: inherit;
}


a.notBlue:visited {
  color: inherit;
}

a.notBlue:hover {
  color: ${colors.linkHover};
}

a.mono {
  font-family: 'Roboto Mono', mono;
}

a.notBlue:visited {
  color: inherit;
}

a.notBlue:hover {
  color: ${colors.linkHover};
}


a:visited {
  color: blue;
}

a:hover {
  color: #00008B;
}

h1, h2 {
  font-family: 'Roboto Mono', monospace;
  font-weight: normal;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

h1 {
font-size:2.8rem;
font-weight: bold;
}

h2 {
  font-size: 2rem;
font-weight: bold;
}

h3 {
font-size: 1.375rem;
font-weight: 900;
}

h4 {
font-weight: 900;
}

p { margin: 0; }
hr {
  width: 100%;
  color: black;
  border: 1px solid;
}

small {
color: ${colors.textSecondary};
}
`
