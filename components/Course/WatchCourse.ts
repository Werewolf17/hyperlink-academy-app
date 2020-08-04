import styled from '@emotion/styled'
import h from 'react-hyperscript'
import { useState } from 'react'

import { useUserData, useUserCourses } from 'src/data'
import { colors } from 'components/Tokens'
import { WatchCourseMsg, WatchCourseResult } from 'pages/api/courses/[id]/watch'
import { callApi } from 'src/apiHelpers'
import Loader  from 'components/Loader'

export function WatchCourse(props:{id: number}) {
  let {data: userCourses, mutate} = useUserCourses()
  let {data: user} = useUserData()
  let watching = userCourses?.watching_courses.find(c=> c.course === props.id)
  let [loading, setLoading] = useState(false)

  // Should probably throttle toggles to this at some point!
  return h(WatchCourseBox, [
    h('img', {src: watching ? '/img/watching.png' : '/img/not-watching.png'}),
    h("div", [
      h('p', [watching ? "You're watching this course" : "Want emails on new cohorts? "]),
      h('div', {}, h('a', {href: '', onClick:async (e: React.MouseEvent)=>{
        e.preventDefault()
        if(!userCourses || !user || loading) return
        setLoading(true)
        let res = await callApi<WatchCourseMsg, WatchCourseResult>(`/api/courses/${props.id}/watch`, {watching: !watching})
        setLoading(false)
        if(res.status === 200) {
          if(watching) mutate({...userCourses, watching_courses: userCourses.watching_courses.filter(x=>x.course !== props.id)})
          else mutate({...userCourses, watching_courses: [...userCourses.watching_courses, {course: props.id, person: user.id}]})
        }
      }}, loading ? h(Loader) : watching? "Unwatch?" : "Watch this course!" ))
    ])
  ])
}

const WatchCourseBox = styled('div')`
padding: 16px;
align-items: center;
max-width: 300px;
display: grid;
grid-gap: 16px;
grid-template-columns: min-content auto;
border: 1px dashed;
border-color: ${colors.borderColor};
background-color: white;
`
