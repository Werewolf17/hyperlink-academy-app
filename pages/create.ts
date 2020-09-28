import h from 'react-hyperscript'
import styled from '@emotion/styled'

import Intro from '../writing/CreatorIntro.mdx'
import Courses from '../writing/CreatorCourses.mdx'
import Process from '../writing/CreatorProcess.mdx'
import Features from '../writing/CreatorFeatures.mdx'
import Pricing from '../writing/CreatorPricing.mdx'
import Cta from '../writing/CreatorCTA.mdx'

import { Box, ThreeColumn , FourColumn } from '../components/Layout'
import { colors } from 'components/Tokens'
// import { colors } from '../components/Tokens'
// import Link from 'next/link'

// export let COPY = {
// 	key: "val",
// }

const CreatorLanding = () => {
return h(Box, {gap:64}, [
	h(Intro),
	h(Box, {gap:32}, [
		h(Section, [
			h(Box, {gap:16}, [
				h('h2', "We're here for serious, social learning."),
				h ('p.big', "There are other places you can upload a video playlist or sell some files. Hyperlink is for active, transformative learning, where people are front and center."),
				h ( 'p.big', "Course that work well on Hyperlink:"),
			]),
		]),

		h(FourColumn, [
			h(CourseProperties, [
				h('h3', "Nurture a Niche"),
				h('p', "Focus on a specific subject; explore it deeply through a striking lens"),
			]),
			h(CourseProperties, [
				h('h3', "Reward Repetition"),
				h('p', "Align with your practice, help your work grow, improve over time"),
			]),
			h(CourseProperties, [
				h('h3', "Propel a Project"),
				h('p', "Guide people to actively make or achieve something meaningful"),
			]),
			h(CourseProperties, [
				h('h3', "Create Community"),
				h('p', "Bring people together, with lasting connection and impact"),
			]),
		]),
	]),
	h(Process),

		h(Box, {gap:32}, [
			h(Section, [
				h(Box, {gap:16}, [
					h('h2', "Hyperlink Features"),
					h ( 'p.big', "Hyperlink is new. You can impact the shape of this community and what features we build. If you want something, suggest it!"),
				]),
			]),

			h(ThreeColumn, [
				h(Feature, [
					h('h4', "Simple Course Creation"),
					h('p.textSecondary', "Set a price, and configure templates to structure the learning experience — we'll help you get everything set up!"),
				]),
				h(Feature, [
					h('h4', "Powerful Templates"),
					h('p.textSecondary', "Configure course templates that will generate structure for each cohort you run"),
				]),
				h(Feature, [
					h('h4', "Cohort Scheduling"),
					h('p.textSecondary', "Run the course as often as you like, everything set up and ready to go"),
				]),
				h(Feature, [
					h('h4', "Registration and Payments"),
					h('p.textSecondary', "Invite students, collect payments via Stripe, fill your cohorts"),
				]),
				h(Feature, [
					h('h4', "Discussion Space"),
					h('p.textSecondary', "We set up a forum for your course, with a private space for each cohort"),
				]),
				h(Feature, [
					h('h4', "Creator Community"),
					h('p.textSecondary', "Take the Meta Course, and join a community of like-minded course creators"),
				]),
			]),
	]),

	h(Box, {gap:32}, [
		h(Section, [
			h(Box, {gap:16}, [
				h('h2', "Pricing"),
				h('p.big', "Simple, transparent pricing — no tiers or metering; you get access to all features right from the get go. Here's how it works:"),
				h('ol', [
					h('li', ["You set the price for your course"]),
					h('li', "Hyperlink takes a 20% platform fee, including payment processing"),
					h('li', "You get 80% of all tution for your courses"),
				]),
			]),
		]),
	]),

		
	h(Pricing),
	h(Cta),
])
}

export default CreatorLanding

const Section = styled('div')`
	max-width: 640px;
	margin: auto auto;
`


const CourseProperties = styled('div')`
	background-color: pink;
`

const Feature = styled('div')`
	background-color: white;
	border: dashed 1px;
	border-radius: 2px;
	border-color: ${colors.grey55};
	padding: 16px;
`