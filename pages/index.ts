import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next'

import Intro from 'writing/Intro.mdx'
import { Mobile, Tablet} from 'components/Tokens'
import { Box, Body} from 'components/Layout'
import { Primary } from 'components/Button'
// import {TitleImg} from '../components/Images'
import { useCourses } from 'src/data'
import {getToken} from 'src/token'
import NewsletterSignup from 'components/NewsletterSignup'
import { coursesQuery } from 'pages/api/courses'
import CoursesAndClubsList from 'pages/courses'

let COPY = {
  hyperlinkTagline: "Hyperlink is a course platform and online school built for seriously effective learning.",
  registerHeader: "Calling all superlearners! Join the Hyperlink Alpha to propose a course idea, and (very soon!) enroll one of our first courses.",
  registerButton: "Browse the Courses",
  emailHeader: "Get updates about new courses and more!",
  emailDescription: "We'll never spam or share your email. You can unsubscribe at any time.",
  emailButton: "Get Updates",
  coursesHeader: "All Courses",
}

type Props = InferGetServerSidePropsType<typeof getServerSideProps>
const Landing = (props:Props) => {
  let {data: courses} = useCourses({initialData:props})

  return h(Box, {gap:48}, [
    h(Welcome),
    h(WhyHyperlink, {}, h(Body, {}, h(Intro))),
    !courses ? null : h(CoursesAndClubsList, courses)
  ])
}

const Welcome = () =>{
  return h(LandingContainer, [
    h(Box, {gap:16}, [
      h(Box, {gap:32}, [
      h(Title, ['hyperlink.', h('wbr'), 'academy']),
      h(Tagline, COPY.hyperlinkTagline),
      ]),
      h(CTAGrid, [
        h('a', {href:'#courses'}, h(Primary, {}, COPY.registerButton)),
        h(NewsletterSignup)
      ]),
    ]),
  ])
}

let WhyHyperlink = styled('div')`
background-color: #F0F7FA;
width: 100vw;
position: relative;
left: 50%;
right: 50%;
margin-left: -50vw;
margin-right: -50vw;
text-align: center;
`

export const getServerSideProps = async ({req,res}:GetServerSidePropsContext) => {
  let token = getToken(req)
  if(!token) {
    let courses = await coursesQuery()
    return {props: {courses}} as const
  }

  res.writeHead(303, {Location: '/dashboard'})
  res.end()
  return {props:{courses:[]}}
}


const LandingContainer = styled('div')`
/* setting up the background image */
background-image: url('/img/landing.png');
background-repeat: no-repeat;
background-position: right center;
background-size: 75%;
image-rendering: pixelated;
image-rendering: crisp-edges;
height: 700px;

${Tablet} {
  height: auto;
  background-position: right 80px;
};


${Mobile}{
  background-position: center 104px;
  background-size: 280px;

};
`

/* Text Styling for Landing Content */
const Title = styled('h1')`
font-family: 'Roboto Mono', monospace;
font-size: 4rem;
text-decoration: none;
font-weight: bold;
color: blue;
z-index: 2;

${Tablet} {
  font-size: 2.625rem;  
}
`

const Tagline = styled('h3')`
z-index: 2;
width: 33%;

  ${Mobile} {
    padding-top: 176px;
    width: 100%;
  }
`

const CTAGrid = styled('div')`
  width: 25%;
  display: grid;
  grid-gap: 32px; 
  grid-template-rows: auto auto;

  ${Tablet}{
    width: 100%;
  }
`

export default Landing
