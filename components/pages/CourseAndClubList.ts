import h from 'react-hyperscript'
import Link from 'next/link'
import { useCourses, Courses } from 'src/data'
import { Box, Seperator } from 'components/Layout'
import { colors} from 'components/Tokens'
import { Primary, Secondary } from 'components/Button'
import { ClubCard, CourseCard, FlexGrid } from 'components/Card'
import {WatchCourseInline} from 'components/Course/WatchCourse'
import { prettyDate } from 'src/utils'

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

  let [min, mobileMin] = props.type === 'club' ? [290, 290] : [400, 200]
  let CardComponent =  props.type === 'club' ? ClubCard : CourseCard

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
    h('h3.textSecondary', "Upcoming"),
    h(FlexGrid, {min , mobileMin},
      upcoming.map(course => {
        return h('div', [
          h(CardComponent, {...course, key: course.id}),
          h(Box, {padding: 16, gap: 8, style:{backgroundColor:colors.accentPeach}}, course.course_cohorts.flatMap(c=>[
            h(Box, {h:true, style:{gridTemplateColumns:"auto auto"}}, [
              h('div', [
                h('b',`Cohort #${c.name}`),
                h('p', `Starts ${prettyDate(c.start_date)}`),
                course.cohort_max_size === 0 ? null : course.cohort_max_size > c.people_in_cohorts.length
                  ? h('span.accentSuccess', `${course.cohort_max_size - c.people_in_cohorts.length} ${course.cohort_max_size - c.people_in_cohorts.length === 1 ? 'spot' : 'spots'} left!`)
                  : h('span.accentRed', `Sorry! This cohort is full.`)
              ]),
              h(Link, {href:`/courses/${course.slug}/${course.id}/cohorts/${c.id}`},
                h('a', {style:{justifySelf:"right"}}, h(Secondary, "Details")))
            ]),
            h(Seperator)
          ]).slice(0, -1))
        ])
      })),
    h('h3.textSecondary', `All ${props.type==='club' ? "Clubs" : "Courses"}`),
    h('p.textSecondary', {style:{maxWidth:640}}, `If anything looks interesting, be sure to watch it to get updates when a new
cohort is available AND inspire the facilitator to plan new cohorts`),
    h(FlexGrid, {min, mobileMin},
      inactive.map(course => {
        return h('div', [
          h(CardComponent, {...course}),
          h(Box, {padding: 16, gap: 8, style:{backgroundColor:colors.accentPeach}}, [
            h('div', {style:{justifySelf: "right"}}, [
              h(WatchCourseInline, {id: course.id})
            ])
          ])
        ])
      })),
  ])
}
