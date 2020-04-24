import h from 'react-hyperscript'
import styled from 'styled-components'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {EnrollMsg, EnrollResponse} from '../../pages/api/courses/enroll'
import { Primary} from '../Button'
import { Box} from '../Layout'
import {colors} from '../Tokens'
import Loader from '../Loader'
import {CourseData} from '../../pages/courses/[id]'
import {useUserData, useUserInstances} from '../../src/user'
import { callApi } from '../../src/apiHelpers'

type Props = {
  instances: CourseData['course_instances']
  cost: number,
  duration: string,
}

export default (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)
  let [selection, setSelection] = useState<null | number>(null)

  let {data:user} = useUserData()
  let {data: instances} = useUserInstances()


  const callEnroll = async ()=>{
    if(!user) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!stripe || selection === null) return
    setLoading(true)
    let res = await callApi<EnrollMsg, EnrollResponse>('/api/courses/enroll', {instanceID: props.instances[selection].id})
    if(res.status === 200) {
      await stripe.redirectToCheckout({
        sessionId: res.result.sessionId
      })
    }
    setLoading(false)
  }

  if(user === undefined) return null

  let userInNextInstance = instances && instances.course_instances.find(instance => instance.id === props.instances[0].id)
  if(user && userInNextInstance) return h('a', {
    href: 'https://forum.hyperlink.academy/g/' + props.instances[0].id
  }, h(Primary, 'Your instance group'))

  return h(Box, {gap: 16}, [
    h('div', [
      h(Cost, '$' + props.cost),
      h('b', props.duration)
    ]),
    h(Divider),
    h('div', [
      h('h4', "Enroll in a run"),
      h('small', "Select a time that works for you")
    ]),
    h(Box, {gap: 8}, props.instances.map((instance, index)=>{
      return h(Item, {
        style: {display: 'grid', gridTemplateColumns: "auto auto"},
        onClick: ()=> setSelection(index === selection ? null : index)
      }, [
        h(Radio, {
          id: instance.id,
          readOnly: true,
          type: 'radio',
          checked: selection === index
        }),
        h(Label, [prettyDate(instance.start_date), ' - ', prettyDate(instance.end_date)]),
      ])
    })),
    h(Primary, {
      disabled: selection === null,
      style: {
        width: '100%'
      },
      onClick: callEnroll
    }, loading ? h(Loader) : 'Enroll'),
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})

let Item = styled('div')`
display: grid;
grid-template-columns: auto auto;
&:hover {
cursor: pointer;
input {
  border: 2px solid;
}
}
`

let Radio = styled('input')`
appearance: none;
border-radius: 50%;
border: 1px solid;
width: 16px;
height: 16px;
box-shadow:0px 0px 0px 2px white inset;

&:active {
outline: none;
}

&:checked {
border: 2px solid;
box-shadow:0px 0px 0px 2px white inset;
background-color: black;
}
`

let Label = styled('h4')`
display: inline;
`

const Cost = styled('div')`
font-size: 56px;
font-weight: bold;
`

let Divider = styled('hr')`
color: ${colors.grey55};
border-style: dashed;
`
