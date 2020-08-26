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
    h(FlexGrid, {min: 328, mobileMin: 200},
      courses?.courses
        .map(course => {
          return h(CourseCard, course)
        }))
  ])
}

export const getStaticProps = async () => {
  let courses = await coursesQuery()
  return {props: {courses}, unstable_revalidate: 1} as const
}
