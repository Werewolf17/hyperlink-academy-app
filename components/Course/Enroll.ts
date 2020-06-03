import h from 'react-hyperscript'
import styled from '@emotion/styled'

import { Box } from '../Layout'
import {colors} from '../Tokens'
import { Course} from '../../src/data'
import { ReactElement } from 'react'

type Props = {
  instanceId?: string,
  course?: Course
}

const Enroll:React.SFC<Props> = (props) => {
  //Laying out the Enroll Panel
  return h(StickyWrapper, [
    //Enroll Details (cost, length, prereqs)
    h(Box, {gap:16}, [
      h(Cost, '$' + props.course?.cost),
      h(Box, {gap: 8, style:{color: colors.textSecondary}}, [
        h('b', props.course?.duration),
        h(Box, {gap: 4}, [
          h('b', 'Prerequisites'),
          h('p', props.course?.prerequisites)
        ]),
      ]),
      props.children as ReactElement ,
    ])
  ])
}

export default Enroll


const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

// Add a wrapper around Enroll Panel so apply the sticky feature on screens above 768px
export const StickyWrapper = styled('div')`
position: sticky;
top: 32px;
`
