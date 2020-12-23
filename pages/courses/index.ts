import h from 'react-hyperscript'
import { coursesQuery } from 'pages/api/courses'
import { InferGetStaticPropsType } from 'next'
import Link from 'next/link'
import { useCourses, Courses as CoursesType } from 'src/data'
import { Box, Seperator } from 'components/Layout'
import { Mobile } from 'components/Tokens'
import styled from '@emotion/styled'
import { Primary, Secondary } from 'components/Button'
import { ClubCard, CourseCard, FlexGrid } from 'components/Card'

type Props = InferGetStaticPropsType<typeof getStaticProps>
export default function Courses(props:Props) {
  let {data: allCourses} = useCourses(props)

  let [clubs, courses] = (allCourses ? allCourses : props).courses
    .sort((a, b)=>{
      let upcomingCohortA = a.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]
      let upcomingCohortB = b.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]

      // if no cohorts sort by name
      if(!upcomingCohortA && !upcomingCohortB) return a.name > b.name ? 1 : -1

      // move courses with no cohorts earlier
      if(!upcomingCohortA) return 1
      if(!upcomingCohortB) return -1

      // move full cohorts to the end
      if(a.cohort_max_size === upcomingCohortA.people_in_cohorts.length) return 1
      if(b.cohort_max_size === upcomingCohortB.people_in_cohorts.length) return -1
      return new Date(upcomingCohortA.start_date) < new Date(upcomingCohortB?.start_date) ? -1 : 1
    })
    .reduce((acc, course)=> {
      acc[course.type === 'club' ? 0 : 1].push(course)
      return acc
    }, [[],[]] as CoursesType['courses'][])

  return h(Box, {gap: 32} ,[
    h(StickyContainer, [
      h(NavBanner, [
        h(Box, {h: true, gap: 32}, [
          h(Box, {h: true, style:{alignItems: 'center'}}, [
            h(NoMobile, [
              h('p', "Deep Learning"),
            ]),
            h('a', {href:"#courses"}, h(Secondary, "Courses")),
          ]),
          h(Seperator),
          h(Box, {h: true, style:{alignItems: 'center'}}, [
            h('a', {href:'#clubs'}, h(Secondary, "Clubs")),
            h(NoMobile, [
              h('p', "Light Learning")
            ])
          ])
        ])
      ])
    ]),
    h(Box, {gap: 64}, [
      h(Box, {gap: 32, id: 'courseList'}, [
        h(Box, {width: 640}, [
          h('h1', {id: 'courses', style:{scrollMarginTop: '96px'}}, "Courses"),
          h('p.big', `Courses are deep dives into a subject, led by a facilitator experienced in the field.`),
          h(Link, {href: "/forms/propose-course"}, h('a', {}, h(Primary, 'Propose a new Course!')))
        ]),
        h(FlexGrid, {min: 400, mobileMin: 200},
          courses.map(course => {
            return h(CourseCard, {...course, key: course.id})
          })),
      ]),
      h(Box, {gap:32}, [
        h(Box, {width: 640}, [
          h('h1', {id: 'clubs', style:{scrollMarginTop: '96px'}}, "Clubs"),
          h('p.big', `Clubs are a lightweight way to convene people with shared interests to explore new things together.`),
          h(Link, {href: "/forms/propose-club"}, h('a', {}, h(Primary, 'Propose a new Club!')))
        ]),
        h(FlexGrid,{min: 290, mobileMin: 290}, clubs.flatMap(course=> {
          return course.course_cohorts.map(cohort => {
            return h(ClubCard, {cohort, course, key: cohort.id})
          })
        }))
      ])
    ])
  ])
}

const NoMobile = styled('div')`
${Mobile} {
display: none;
}
`

const StickyContainer = styled("div")`
position: sticky;
top: 0;
padding-top: 16px;
margin-top: -16px;
`

const NavBanner = styled('div')`
background-color: white;
box-shadow: 0px 2px 10px 1px rgba(0,0,0,0.60);
width: fit-content;
box-sizing: border-box;
display: grid;
justify-content: center;
border-radius: 4px;
margin: auto;
padding: 16px;
`


export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, revalidate: 1} as const
}
