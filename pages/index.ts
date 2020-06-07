import h from 'react-hyperscript'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next'
import { useEffect, useState } from 'react'

import Intro from '../writing/Intro.mdx'
import CourseCard, {FlexGrid} from '../components/Course/CourseCard'
import { colors, Mobile} from '../components/Tokens'
import { Box, Body} from '../components/Layout'
import { Primary, Secondary } from '../components/Button'
import { Label, Input } from '../components/Form'
// import {TitleImg} from '../components/Images'
import { useCourses, useUserData } from '../src/data'
import { coursesQuery } from './api/get/[...item]'
import {getToken} from '../src/token'
import { useApi } from '../src/apiHelpers'
import { NewsletterSignupMsg, NewsletterSignupResponse } from './api/signup/[action]'
import Loader from '../components/Loader'
import { Checkmark } from '../components/Icons'

export let COPY = {
  hyperlinkTagline: "Hyperlink is a course platform and online school built for seriously effective learning.",
  registerHeader: "Calling all superlearners! Join the Hyperlink Alpha to propose a course idea, and (very soon!) enroll one of our first courses.",
  registerButton: "Browse the Courses",
  emailHeader: "Drop your email to get updates!",
  emailDescription: "We only use this email to send our fortnightly update. Unsubscribe at any time.",
  emailButton: "Get Updates",
  coursesHeader: "All Courses",
  courseGardenHeader: "Have an idea for a course?",
  courseGardenDescription: `Hyperlink courses are created by our community. We seed and grow them in the Course
Garden. Check out some in development, or propose your own!`,
  courseGardenLink: "Check out the Course Garden"
}

type Props = InferGetServerSidePropsType<typeof getServerSideProps>
const Landing = (props:Props) => {
  let {data: courses} = useCourses(props)
  let {data: user} = useUserData()
  let router = useRouter()
  useEffect(()=>{
    if(user) router.push('/dashboard')
  }, [user])

  return h(Box, {gap:48}, [
    h(Welcome),
    h(WhyHyperlink, {}, h(Body, {}, h(Intro))),
    h(Box, {gap: 16}, [
      h('h2', {id: 'courses'}, COPY.coursesHeader),
      !courses ? null : h(FlexGrid, {min: 328, mobileMin: 200},
                          courses.courses
                          .map(course => {
                            return h(CourseCard, {
                              key: course.id,
                              id: course.id,
                              description: course.description,
                              start_date: new Date(course.course_cohorts[0]?.start_date),
                              name: course.name,
                            }, [])
                          })),
    ]),
    h(Box, { padding: 32, style:{backgroundColor: colors.grey95}}, [
      h(Box, {width: 640, ma: true}, [
        h('h2', COPY.courseGardenHeader),
        COPY.courseGardenDescription,
        h('span', {style:{color: 'blue', justifySelf: 'end'}}, [
          h('a.mono',{href: 'https://forum.hyperlink.academy/c/course-garden/'}, COPY.courseGardenLink),
          h('span', {style: {fontSize: '1.25rem'}}, '\u00A0 ➭')
        ])
      ])
    ]),
  ])
}

const Welcome = () =>{
  //Setting up the email subscription stuff
  let [email, setEmail] = useState('')
  let [status, callNewsletterSignup] = useApi<NewsletterSignupMsg, NewsletterSignupResponse>([email])

  let onSubmit = (e: React.FormEvent)=>{
    e.preventDefault()
    callNewsletterSignup('/api/signup/newsletter',{email})
  }

  let ButtonText = {
    normal: COPY.emailButton,
    loading: h(Loader),
    success: Checkmark,
    error: "Something went wrong!"
  }


  return h(Box, {gap:32}, [
    //Landing Page Top Banner
    h(LandingContainer, [
      h(Box, {gap:32}, [
        //Title and Tagline
        h(Title, ['hyperlink.', h('wbr'), 'academy']),
        h(Tagline, COPY.hyperlinkTagline),
        
        h(CTAGrid, [
          h('a', {href:'#courses'}, h(Secondary, {}, COPY.registerButton)),
          h('form', {onSubmit}, h(Box, {gap: 16, style:{maxWidth: 320}}, [
            h(Label, [
              h(Box, {gap:4}, [
                COPY.emailHeader,
                h(Description, COPY.emailDescription),
              ]),
              h(Input, {
                type: "email",
                value: email,
                onChange: e => setEmail(e.currentTarget.value)
              }),
            ]),
            h(Primary, {type: "submit", success: status === 'success'}, ButtonText[status]),
          ])),
        ]),
      ]),
    ]),

    //Page Content
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

  res.writeHead(301, {Location: '/dashboard'})
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

@media (max-width: 768px) {
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

@media (max-width: 768px) {
  font-size: 2.625rem;  
}

${Mobile} {
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
const Description = styled('p')`
font-size: 0.75rem;
font-weight: normal;
color: ${colors.textSecondary};
  ${Mobile} {
    width: 100%;
    
  }
`
const CTAGrid = styled('div')`
  width: 25%;
  display: grid;
  grid-gap: 32px; 
  grid-template-rows: auto auto;

  @media (max-width: 768px) {
    width: 100%;
  }
`

export default Landing
