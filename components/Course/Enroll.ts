import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'

import {EnrollMsg, EnrollResponse} from '../../pages/api/courses/[action]'
import { Primary} from '../Button'
import { Box, Seperator} from '../Layout'
import {colors} from '../Tokens'
import Loader from '../Loader'
import { useUserData, useCourseData, useUserInstances} from '../../src/data'
import { callApi } from '../../src/apiHelpers'
import { InstanceCard } from '../Card'

type Props = {
  instanceId?: string,
  courseId: string
}

const Enroll = (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)

  let {data:user} = useUserData()
  let {data:course} = useCourseData(props.courseId)
  let {data: userInstances} = useUserInstances()

  const onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()

    if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!props.instanceId) return
    if(!stripe) return

    setLoading(true)
    let res = await callApi<EnrollMsg, EnrollResponse>('/api/courses/enroll', {
      instanceID: props.instanceId
    })
    if(res.status === 200) await stripe.redirectToCheckout({sessionId: res.result.sessionId})
    setLoading(false)
  }
  let instance = course?.course_instances.find(i=> i.id===props.instanceId)

  return h(Container, {gap: 16}, [
      h(Cost, '$' + course?.cost),
    h(Box, {gap: 8, style:{color: colors.textSecondary}}, [
      h('b', course?.duration),
      h('b', 'Prerequisites'),
      h('p', course?.prerequisites)
    ]),
    h(Seperator),
    instance ?
      h(Box, {as: "form", onSubmit}, [
        h(Label, [prettyDate(instance.start_date)]),
        h('p', 'facillitated by ' + instance.people?.display_name),
        h(Primary, {
          style: {width: '100%'},
        }, loading ? h(Loader) : 'Enroll'),
      ])
      : h(Box, {gap: 16}, [
        h('div', [
          h('h3', 'Enroll in an Instance'),
          h('div', {style: {color: colors.textSecondary, fontSize: '0.8rem', fontWeight: 'bold'}},
            'Click on an instance below for details'),
        ]),
        ...course?.course_instances
          .filter(i => !userInstances?.course_instances.find(x => x.id === i.id))
          .map(instance => h(Link, {href: "/courses/[id]/[instanceID]", as:`/courses/${props.courseId}/${instance.id}`},
                             h(InstanceCard, {
                               start_date: instance.start_date,
                               facillitator: instance.people.display_name || instance.people.username
                             }))
              ) || []
      ])
  ])
}

export default Enroll

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

let Container = styled(Box)`
position: sticky;
top: 32px;
`

let Label = styled('h4')`
display: inline;
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`
