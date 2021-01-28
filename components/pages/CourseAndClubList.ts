import h from 'react-hyperscript'
import Link from 'next/link'
import { useCourses, Courses } from 'src/data'
import { Box } from 'components/Layout'
import { colors} from 'components/Tokens'
import { Primary } from 'components/Button'
import { ClubCard, CourseCard, FlexGrid } from 'components/Card'
import {WatchCourseInline} from 'components/Course/WatchCourse'
import { CourseCohortCard, ClubCohortCard} from 'components/Cards/CohortCard'
import styled from '@emotion/styled'

export function CourseAndClubList(props:{initialData:Courses, type: "club" | "course"}) {
  let {data: allCourses} = useCourses({initialData:props.initialData, type: props.type})

  let [upcoming, inactive] = (allCourses ? allCourses : props.initialData).courses
    .reduce((acc, course)=> {
      let upcoming = course.course_cohorts.filter(c=> course.cohort_max_size === 0 || course.cohort_max_size !==c.people_in_cohorts.length)[0]
      acc[upcoming ? 0 : 1].push(course)
      return acc
    }, [[],[]] as Courses['courses'][])

  inactive = inactive.sort((a,b) => a.name > b.name ? 1 : -1)
  upcoming = upcoming.sort((a,b)=>{
      let upcomingCohortA = a.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]
      let upcomingCohortB = b.course_cohorts.filter(c=>new Date(c.start_date) > new Date())[0]

      if(upcomingCohortA.start_date === upcomingCohortB.start_date) return a.name > b.name ? 1 : -1
      return new Date(upcomingCohortA.start_date) < new Date(upcomingCohortB?.start_date) ? -1 : 1
  })

  let [min, mobileMin] = props.type === 'club' ? [290, 290] : [400, 400]
  let CardComponent =  props.type === 'club' ? ClubCard : CourseCard
  let CohortCardComponent = props.type === 'club' ? ClubCohortCard : CourseCohortCard

  return h(Box, {gap: 32} ,[
    props.type === 'club' ?h(Box, {width: 640}, [
        h('h1', "Clubs"),
        h('p.big', `Clubs are a lightweight way to convene people with shared interests to explore new things together.`),
        h(Link, {href: "/forms/propose-club"}, h('a', {}, h(Primary, 'Propose a new Club!')))
      ])
      : h(Box, {width: 640}, [
        h('h1', "Courses"),
        h('p.big', `Courses are deep dives into a subject, led by a facilitator experienced in the field.`),
        h(Link, {href: "/forms/propose-course"}, h('a', {}, h(Primary, 'Propose a new Course!')))
      ]),
    h('h3.textSecondary', "Upcoming " + (props.type === 'club' ? "Clubs" : "Cohorts")),
    h(FlexGrid, {min , mobileMin},
      upcoming.flatMap(course => {
        return course.course_cohorts.map(cohort=>{
          return h(CohortCardComponent, {...cohort, course})
        })
      })),
    h('h3.textSecondary', `All ${props.type==='club' ? "Clubs" : "Courses"}`),
    h('p.textSecondary', {style:{maxWidth:640}}, `If anything looks interesting, be sure to watch it to get updates when a new
cohort is available AND inspire the facilitator to plan new cohorts`),
    h(FlexGrid, {min, mobileMin},
      inactive.map(course => {
        if(props.type==='club') return h(CourseContainer, [
          h(ClubHeader, course.card_image.split(',').map(src=> h('img', {src}))),
          h(Link, {href:`/courses/${course.slug}/${course.id}`}, h('a.notBlue', {style:{textDecoration:'none'}}, h('h3', course.name))),
          h('p', course.description),
          h(WatchCourseInline, {id: course.id})
        ])
        else return h(Box, {h:true, style:{gridAutoColumns:"auto"}}, [
              h('img', {src: course.small_image, style:{height: '128px', border: '1px solid', borderRadius: '64px', boxSizing:"border-box"}}),
              h(CourseContainer, [
                h(Link, {href:`/courses/${course.slug}/${course.id}`}, h('a.notBlue', {style:{textDecoration:'none'}}, h('h3', course.name))),
                h('p', course.description),
                h(WatchCourseInline, {id: course.id})
              ])
        ])
      })),
  ])
}

const CourseContainer = styled('div')`
display: grid;
grid-gap: 16px;
grid-template-rows: min-content auto min-content min-content;
`

const ClubHeader = styled("div")`
background-color: ${colors.accentLightBlue};
border: 1px solid;
border-color: ${colors.borderColor};
border-radius: 2px;
width: min-content;
display: grid;
grid-template-columns: repeat(3, min-content);
grid-gap: 16px;
padding: 8px;
`
