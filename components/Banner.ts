import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { Tablet, Mobile, colors } from './Tokens'

export const TwoColumnBanner = (props: any) => {
  return h(Banner, [
    h('div', {style:{maxWidth: 960, padding: 16, margin: 'auto'}}, h(BannerInner, [
      props.children
    ]))
  ])
}

const BannerInner = styled('div')`
display: grid;
grid-template-columns: 2fr 1fr;
grid-gap: 64px;
${Tablet} {
  grid-template-columns: auto;
  grid-template-rows: auto ;
}
`

const Banner = styled('div')<{red?: boolean}>`
background-color: ${props => props.red ? colors.backgroundRed: colors.grey95};
position: relative;
width: 100vw;
position: relative;
left: 50%;
right: 50%;
margin-left: -50vw;
margin-right: -50vw;

margin-bottom: 16px;
margin-top: -48px;
${Mobile}{
margin-top: 0px
}
`
