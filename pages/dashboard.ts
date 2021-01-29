import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import { useEffect } from 'react'

import {colors} from 'components/Tokens'
import { Box, WhiteContainer, FlexGrid} from 'components/Layout'
import {ClubCohortCard, CourseCohortCard} from 'components/Cards/CohortCard'
import {ClubListing, CourseListing} from 'components/pages/CourseAndClubList'
import { PageLoader } from 'components/Loader'
// import { AccentImg } from '../components/Images'
import { useUserCohorts, useUserData, useUserCourses, useProfileData } from 'src/data'
import { Tabs } from 'components/Tabs'
import Settings from 'components/pages/dashboard/Settings'
import {Primary, SmallLinkButton} from 'components/Button'
import { EnrolledCohort } from 'components/pages/dashboard/EnrolledCohort'
import { Calendar } from 'components/Icons'

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
  let {data: user, mutate} = useUserData()
  let {data: cohorts} = useUserCohorts()
  let {data: profile, mutate:mutateProfile} = useProfileData(user ? user.username : undefined)
  let {data: userCourses} = useUserCourses()
  let router = useRouter()

  useEffect(() => {
    if(user === false) router.push('/')
  }, [user])

  if(!user || cohorts === undefined || userCourses === undefined || profile === undefined || profile === false) {
    return h(PageLoader)
  }

  let completedCohorts = cohorts.course_cohorts.filter(c=> c.completed)
  let activeCohorts = cohorts.course_cohorts
    .filter(c=>!c.completed)
    .sort((a, b)=>{
      if(new Date(a.start_date) < new Date(b.start_date)) return -1
      return 1
    })
  let [clubs, courses] = userCourses.maintaining_courses.reduce((acc, c)=> {
    acc[c.type === 'club' ? 0 : 1].push(c)
    return acc
  }, [[],[]] as Array<typeof userCourses.maintaining_courses>)

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
                h(Link, {href: '/courses'}, h('a', {style:{marginBottom:'16px'}}, h(Primary, COPY.courseListButton)))
              ]),
            ])
          // if enrolled, show grid of enrolled cohorts
            : h(Box, {gap:32}, [
              h(Link, {href: "/calendar"}, 
                h(SmallLinkButton, {textSecondary: true}, 
                  h(Box, {h:true, gap:8, style: {background: colors.grey95, padding: 16}}, [ Calendar, 'add all events to your calendar'])
                )),

              h(Box, {gap: 64},
                activeCohorts.map(cohort => {
                  let facilitating = cohort.facilitator === (user ? user.id: '')
                  return h(EnrolledCohort, {cohort, facilitating})
                }))
            ]),
          activeCohorts.length === 0 ? null : h(Box, {padding: 32, style:{backgroundColor: colors.accentPeach}}, [
            h(Box, {ma: true, style:{textAlign:"center", justifyItems:"center"}}, [
              h('h2', COPY.courseListHeader),
              h(Link, {href: '/courses'}, h('a', {}, h(Primary, COPY.courseListButton)))
            ])
          ]),
        ]),
        Completed: completedCohorts.length === 0 ? null : h(Box, [
          h(FlexGrid, {min: 400, mobileMin:400}, completedCohorts.map(cohort => {
            if(cohort.courses.type === 'club') return ClubCohortCard({...cohort, course: cohort.courses})
            return h(CourseCohortCard, {...cohort, course:cohort.courses})
            }))
        ]),
        Maintaining: userCourses.maintaining_courses.length === 0 ? null : h(Box, {gap: 32}, [
          h(Box, [
            courses.length > 0 ? h('h2', "Courses") : null,
            h(FlexGrid, {min: 400, mobileMin: 400}, courses.map(course=>h(CourseListing, course))),
          ]),
          h(Box, [
            clubs.length > 0 ? h('h2', "Clubs") : null,
            h(FlexGrid, {min: 290, mobileMin: 290}, clubs.map(course=> h(ClubListing, course)))
          ])
        ]),
        Profile: h(Settings, {
          facilitator:userCourses.maintaining_courses.length !== 0,
          profile,
          user,
          mutate: p => {
            if(user) mutate({...user, ...p})
            if(profile) mutateProfile({...profile, ...p})
          }
        })
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
