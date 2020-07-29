import h from 'react-hyperscript'
// import styled from '@emotion/styled'

import Intro from '../writing/CreatorIntro.mdx'
import Courses from '../writing/CreatorCourses.mdx'
import Process from '../writing/CreatorProcess.mdx'
import Features from '../writing/CreatorFeatures.mdx'
import Pricing from '../writing/CreatorPricing.mdx'
import Cta from '../writing/CreatorCTA.mdx'

import { Box } from '../components/Layout'
// import { colors } from '../components/Tokens'
// import Link from 'next/link'

// export let COPY = {
// 	key: "val",
// }

const CreatorLanding = () => {
return h(Box, {gap:64}, [
	h(Intro),
	h(Courses),
	h(Process),
	h(Features),
	h(Pricing),
	h(Cta),
])
}

export default CreatorLanding