import h from 'react-hyperscript'
import {Section} from '../../components/Section'
import {NextPage} from 'next'

import airtable, {Table} from 'airtable'

type Course = {
  name: string,
  description: string,
  webpage: string
}
type Learner = {
  name: string,
  webpage: string
}

const Semester:NextPage<{courses:Course[], learners:Learner[]} >= (props) => {
  return h('div', [
    h('h1', 'Semester 0'),
    h('b', 'Starts: '), 'October 14, 2019',
    h('ul', {style: {'fontStyle': 'italic'}}, [
      h('li', {}, h('a', {href: '/enrolling'}, 'enroll in this semseter')),
      h('li', {}, h('a', {href: '/facillitating'}, 'facillitate a course'))
    ]),
    h(Section, {legend: 'Learners'}, h('ul', props.learners.map(learner => {
      return h('li', {}, h('a', {href: learner.webpage}, learner.name))
    }))),
    h(Section, {legend: 'Courses'}, h('ul', props.courses.map(course => {
      return h('li', {}, h('a', {href: course.webpage}, course.name))
    })))
  ])
}

Semester.getInitialProps = async ({res}) =>{
  console.log('FETCHING')
  let courses: Course[] = []
  let learners: Learner[] = []

  if(typeof window !== "undefined") return {learners, courses}
  if(!res) return {learners, courses}

  let base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appI77uDPls9eA4xr');

  try {
    let learnerRows = await (base('Learners') as Table<Learner>).select({
      fields: ["name", "webpage"],
      filterByFormula: '{approved}'
    }).firstPage()

    let coursesRows = await (base('Courses') as Table<Course>).select({
      fields: ["name", "webpage", "description"],
      filterByFormula: '{approved}'
    }).firstPage()

    learners =  learnerRows.map(row=> row.fields)
    courses = coursesRows.map(row => row.fields)
  }
  catch(e) {
    console.log(JSON.stringify(e))
  }

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
  return {learners, courses}
}

export default Semester
