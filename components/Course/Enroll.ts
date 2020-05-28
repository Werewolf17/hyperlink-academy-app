import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {EnrollMsg, EnrollResponse} from '../../pages/api/courses/[action]'
import { Primary} from '../Button'
import { Box, Seperator} from '../Layout'
import {colors} from '../Tokens'
import Loader from '../Loader'
import { useUserData, useUserInstances, Course} from '../../src/data'
import { callApi } from '../../src/apiHelpers'
import { SmallInstanceCard } from '../Card'

type Props = {
  instanceId?: string,
  course?: Course
}

const Enroll = (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)

  let {data:user} = useUserData()
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
  let instance = props.course?.course_instances.find(i=> i.id===props.instanceId)

  //Laying out the Enroll Panel
  return h(StickyWrapper, [
    h(EnrollGrid, [

      //Enroll Details (cost, length, prereqs)
      h(Box, {gap:16}, [
        h(Cost, '$' + props.course?.cost),
      h(Box, {gap: 8, style:{color: colors.textSecondary}}, [
        h('b', props.course?.duration),
        h(Box, {gap: 4}, [
          h('b', 'Prerequisites'),
          h('p', props.course?.prerequisites)
        ])
      ]),
      ]),

      //Dotted Separator
      h(Seperator),

      //Upcoming instance list 
      h(Box, {gap:16}, [
        instance ?
          h(Box, {as: "form", onSubmit}, [
            h(Label, [prettyDate(instance.start_date)]),
            h('p', 'facillitated by ' + instance.people?.display_name),
            h(Primary, {
              disabled: !!props.course?.invite_only && props.course?.course_invites.length === 0,
              style: {width: '100%'},
            }, loading ? h(Loader) : 'Enroll'),
          ])
          : h(Box, {gap: 16}, [
            h('div', [
              h('h3', 'Enroll in an Instance'),
              h('div', {style: {color: colors.textSecondary, fontSize: '0.8rem', fontWeight: 'bold'}},
                'Click on an instance below for details'),
            ]),
            ...props.course?.course_instances
              .filter(i => !userInstances?.course_instances.find(x => x.id === i.id) &&
                      !i.completed && (new Date() < new Date(i.start_date)))
              .sort((a, b)=>new Date(a.start_date) < new Date(b.start_date)? -1 : 1)
              .map(instance => h(SmallInstanceCard, instance)) || []
          ])
      ])
    ])
  ])
}

export default Enroll

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})


let Label = styled('h4')`
display: inline;
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

// Add a wrapper around Enroll Panel so apply the sticky feature on screens above 768px
export const StickyWrapper = styled('div')`
position: sticky;
top: 32px;
`

export const EnrollGrid = styled('div')`
display: grid;
grid-template-columns: 1fr;
grid-gap: 16px;

  @media(max-width: 768px) {
    grid-template-columns: 1fr 0px 2fr;
    grid-gap: 16px;
  }

  /* 424px is an artibrarty number not found anywhere else that ensures 
  that the instance cards inside the enroll panel doesn't get too skinny */
  @media(max-width: 424px) {
    grid-template-columns: 1fr;
    grid-gap: 16px;
  }
`
