import h from 'react-hyperscript'
import { coursesQuery } from 'pages/api/courses'
import { InferGetStaticPropsType } from 'next'
import { useCourses } from 'src/data'
import { Box, Seperator } from 'components/Layout'
import CourseCard, { FlexGrid } from 'components/Course/CourseCard'
import { ClubCard } from 'components/Card'
import { Mobile } from 'components/Tokens'
import styled from '@emotion/styled'
import { Secondary } from 'components/Button'

type Props = InferGetStaticPropsType<typeof getStaticProps>
export default function Courses(props:Props) {
  let {data: courses} = useCourses(props)

  let clubs = courses?.courses
    .filter(c=> c.type === 'club')
    .flatMap(course=> {
      return course.course_cohorts.map(cohort => {
        return {cohort, course}
      })
    })

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
        ]),
        h(FlexGrid, {min: 400, mobileMin: 200},
          courses?.courses
            .filter(x=>x.type === 'course')
            .sort((a, b)=>{
              let upcomingCohortA = a.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]
              let upcomingCohortB = b.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]
              if(!upcomingCohortA && !upcomingCohortB) return a.name > b.name ? 1 : -1
              if(!upcomingCohortA) return 1
              if(!upcomingCohortB) return -1
              return new Date(upcomingCohortA.start_date) < new Date(upcomingCohortB?.start_date) ? -1 : 1
            })
            .map(course => {
              return h(CourseCard, course)
            })),
      ]),
      h(Box, {gap:32}, [
        h(Box, {width: 640}, [
          h('h1', {id: 'clubs', style:{scrollMarginTop: '96px'}}, "Clubs"),
          h('p.big', `Clubs are a lightweight way to convene people with shared interests to explore new things together.`),
        ]),
        h(FlexGrid,{min: 290, mobileMin: 290}, clubs?.map(club => {
          return h(ClubCard, club)
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
