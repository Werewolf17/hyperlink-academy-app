import h from 'react-hyperscript'
import airtable, {Table} from 'airtable'
import {NextPage} from 'next'
import Intro from './intro.mdx'

import {Section} from '../components/Section'

type Course = {
  name: string,
  description: string,
  webpage: string
  start: string,
  end: string
}

type Learner = {
  name: string,
  webpage: string
}

const Landing:NextPage<{courses:Course[],learners:Learner[],children?: any}> = (props) => {
  return h('div', [
    h(Intro),
    h(Section, {legend: 'Learners'}, h('ul', props.learners.map(learner => {
      return h('li', {}, h('a', {href: learner.webpage}, learner.name))
    }))),
    h(Section, {legend: 'Courses'}, h('ul', props.courses.sort((a, b) => {
      let aDate = new Date(a.start)
      let bDate = new Date(b.start)
      if(aDate>bDate) return 1
      else return -1
    }).map(course => {
      let start = new Date(course.start)
      let end = course.end ? new Date(course.end) : undefined
      let dateOptions = {month: 'short', year: '2-digit', day: '2-digit', timeZone: 'UTC'}
      return h('li', {}, [
        h('h4', {}, [
          h('a', {href: course.webpage}, course.name),
          ' @ ',
          h('span', [
            start.toLocaleDateString('en-US', dateOptions),
            ' - ',
            end ? end.toLocaleDateString('en-US', dateOptions) : "ongoing"
          ]),
        ]),
        h('div', course.description),
      ])
    })))
  ])
}

Landing.getInitialProps = async ({res}) =>{
  console.log('FETCHING')
  let courses: Course[] = []
  let learners: Learner[] = []

  if(typeof window !== "undefined") return {courses, learners}
  if(!res) return {courses, learners}

  let base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appI77uDPls9eA4xr');

  try {

    let learnerRows = await (base('Learners') as Table<Learner>).select({
      fields: ["name", "webpage"],
      filterByFormula: '{approved}'
    }).firstPage()

    let coursesRows = await (base('Courses') as Table<Course>).select({
      fields: ["name", "webpage", "description", "start", "end"],
      filterByFormula: '{approved}'
    }).firstPage()

    courses = coursesRows.map(row => row.fields)
    learners =  learnerRows.map(row=> row.fields)
  }
  catch(e) {
    console.log(JSON.stringify(e))
  }

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
  return {courses, learners}
}

export default Landing

