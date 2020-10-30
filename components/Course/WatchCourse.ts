import styled from '@emotion/styled'
import h from 'react-hyperscript'
import { useState } from 'react'

import { useUserData, useUserCourses } from 'src/data'
import { colors } from 'components/Tokens'
import { WatchCourseMsg, WatchCourseResult } from 'pages/api/courses/[id]/watch'
import { callApi } from 'src/apiHelpers'
import Loader  from 'components/Loader'
import { Box, FormBox } from 'components/Layout'
import { Input } from 'components/Form'
import { LinkButton } from 'components/Button'

export function WatchCourse(props:{id: number}) {
  let {data: userCourses, mutate} = useUserCourses()
  let {data: user} = useUserData()
  let watching = userCourses?.watching_courses.find(c=> c.course === props.id)
  let [loading, setLoading] = useState(false)

  // Should probably throttle toggles to this at some point!
  if(user===false) return h(EmailWatching, props)
  return h(WatchCourseBox, [
    h(Icon, {src: watching ? '/img/watching.png' : '/img/not-watching.png'}),
    h("div", [
      h('p', [watching ? "You're watching this course" : "Want emails on new cohorts?"]),
      h(LinkButton, {onClick:async (e: React.MouseEvent)=>{
        e.preventDefault()
        if(loading || !user || !userCourses) return
        setLoading(true)
        let res = await callApi<WatchCourseMsg, WatchCourseResult>(`/api/courses/${props.id}/watch`, {watching: !watching})
        setLoading(false)
        if(res.status === 200) {
          if(watching) mutate({...userCourses, watching_courses: userCourses.watching_courses.filter(x=>x.course !== props.id)})
          else mutate({...userCourses, watching_courses: [...userCourses.watching_courses, {course: props.id, email: user.email}]})
        }
      }}, loading ? h(Loader) : watching? "Unwatch?" : "Watch this course!" )
    ])
  ])
}

let EmailWatching = (props:{id: number})=>{
  let [watching, setWatching] = useState(false)
  let [email, setEmail] = useState('')
  let [loading, setLoading] = useState(false)

  const onSubmit = async (e:React.FormEvent) =>{
    e.preventDefault()
    if(loading || !email) return
    setLoading(true)
    let res = await callApi<WatchCourseMsg, WatchCourseResult>(`/api/courses/${props.id}/watch`, {watching: !watching, email: email})
    setLoading(false)
    if(res.status === 200) {
      setWatching(true)
    }
  }
  return h(WatchCourseBox, [
    h(Icon, {src: watching ? '/img/watching.png' : '/img/not-watching.png'}),
    h(Box, {gap: 8}, [
      h('b', [watching ? "You're watching this course" : "Email me when new cohorts are scheduled"]),
      watching ? null : h(FormBox, {gap:8, onSubmit}, [
        h(Input, {value:email, type: 'email', placeholder: 'your email', onChange:(e)=>setEmail(e.currentTarget.value)}),
        h(LinkButton, {type: 'submit', style:{justifySelf:'right'}}, loading ? h(Loader) : "submit" )
      ])
    ])
  ])
}

const Icon = styled('img')`
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
`

const WatchCourseBox = styled('div')`
padding: 16px;
max-width: 300px;
display: grid;
grid-gap: 16px;
grid-template-columns: min-content auto;
border: 1px dashed;
border-color: ${colors.borderColor};
background-color: white;
`
