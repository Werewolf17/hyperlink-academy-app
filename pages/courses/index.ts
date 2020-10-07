import h from 'react-hyperscript'
import { coursesQuery } from 'pages/api/courses'
import { InferGetStaticPropsType } from 'next'
import { useCourses } from 'src/data'
import { Box } from 'components/Layout'
import CourseCard, { FlexGrid } from 'components/Course/CourseCard'

type Props = InferGetStaticPropsType<typeof getStaticProps>
export default function Courses(props:Props) {
  let {data: courses} = useCourses(props)
  return h(Box, {gap: 64}, [
    h('h1', "The Course List"),
    h(FlexGrid, {min: 400, mobileMin: 200},
      courses?.courses
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
        }))
  ])
}

export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, revalidate: 1} as const
}
