import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import { useEffect } from 'react'

import CourseCard, {FlexGrid} from 'components/Course/CourseCard'
import {colors} from 'components/Tokens'
import { Box, WhiteContainer} from 'components/Layout'
import { BigCohortCard } from 'components/Card'
import { PageLoader } from 'components/Loader'
// import { AccentImg } from '../components/Images'
import { useUserCohorts, useUserData, useUserCourses } from 'src/data'
import { Tabs } from 'components/Tabs'
import Settings from 'components/pages/dashboard/Settings'
import {Primary} from 'components/Button'

const COPY = {
  coursesHeader: "All Courses",
  courseListHeader: "There’s always something new to learn!",
  courseListButton: "Find New Courses!",
  courseGardenHeader: "Have an idea for a course?",
  courseGardenDescription: `Hyperlink courses are created by our community. We seed and grow them in the Course
Garden. Check out some in development, or propose your own!`,
  courseGardenLink: "Check out the Course Garden"
}

const Dashboard = () => {
  let {data: user} = useUserData()
  let {data: cohorts} = useUserCohorts()
  let {data: userCourses} = useUserCourses()
  let router = useRouter()

  useEffect(() => {
    if(user === false) router.push('/')
  }, [user])

  if(!user || cohorts === undefined || userCourses === undefined) {
    return h(PageLoader)
  }

  let completedCohorts = cohorts.course_cohorts.filter(c=> c.completed)
  let activeCohorts = cohorts.course_cohorts.filter(c=>!c.completed)

  return h(Box, {gap:64}, [
    h('h1', `Hello ${user.display_name || user.username}!`),
    h(Tabs, {
      tabs: {
        Enrolled: h(Box, {gap:64}, [
          activeCohorts.length === 0
            ? h (WhiteContainer, [
              h(Box, {gap:16, style: {maxWidth: 400, textAlign: 'center', margin: 'auto'}}, [
                h( EmptyImg, {src: 'img/empty.png'}),
                h('small.textSecondary', "Hmmm... Looks like you haven't enolled in anything yet. Check out some available courses in the Course List below!" ),
              ]),
            ])
          // if enrolled, show grid of enrolled cohorts
            : h(FlexGrid, {min: 250, mobileMin:250}, activeCohorts.map(cohort => {
              let facilitating = cohort.facilitator === (user ? user.id: '')
              return h(BigCohortCard, {...cohort, enrolled: !facilitating, facilitating})
            })),
          h(Box, { padding: 32, style:{backgroundColor: colors.grey95}}, [
            h(Box, {ma: true, style:{textAlign:"center", justifyItems:"center"}}, [
              h('h2', COPY.courseListHeader),
              h(Link, {href: '/courses'}, h(Primary, COPY.courseListButton))
            ])
          ]),
        ]),
        Completed: completedCohorts.length === 0 ? null : h(Box, [
          h(FlexGrid, {min: 250, mobileMin:250}, completedCohorts.map(cohort => {
              let facilitating = cohort.facilitator === (user ? user.id: '')
              return h(BigCohortCard, {...cohort, enrolled: !facilitating, facilitating})
            }))
        ]),
        Maintaining: userCourses.maintaining_courses.length === 0 ? null : h(Box, {}, [
            h(FlexGrid, {min: 328, mobileMin: 200}, userCourses.maintaining_courses.map(course=>{
              return h(CourseCard, course)
            }))
          ]),
        Profile: h(Settings)
      }}),
  ])
}

export let EmptyImg = styled ('img') `
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
display: block;
margin: auto auto;
border: none;
height: 200px;
width: 200px;
`

export default Dashboard
