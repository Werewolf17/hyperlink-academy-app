import h from 'react-hyperscript'
import styled from 'styled-components'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {EnrollMsg, EnrollResponse} from '../../pages/api/courses/[action]'
import { Primary} from '../Button'
import { Box} from '../Layout'
import {colors} from '../Tokens'
import Loader from '../Loader'
import { useUserData, useUserInstances, useCourseData} from '../../src/data'
import { callApi } from '../../src/apiHelpers'

type Props = {
  id: string,
}

export default (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)
  let [selection, setSelection] = useState<null | number>(null)

  let {data:user} = useUserData()
  let {data: userInstances} = useUserInstances()
  let {data: courseData} = useCourseData(props.id)


  if(user === undefined || courseData === undefined) return null
  let validInstances = courseData?.course_instances
      .filter(instance => !userInstances?.course_instances.find(x=> x.id === instance.id))

  const callEnroll = async ()=>{
    if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!stripe || !validInstances||selection === null) return
    setLoading(true)
    let res = await callApi<EnrollMsg, EnrollResponse>('/api/courses/enroll', {instanceID: validInstances[selection].id})
    if(res.status === 200) {
      await stripe.redirectToCheckout({
        sessionId: res.result.sessionId
      })
    }
    setLoading(false)
  }


  return h(Box, {gap: 16}, [
    h('div', [
      h(Cost, '$' + courseData.cost),
      h('b', courseData.duration)
    ]),
    h(Divider),
    h('div', [
      h('h4', "Enroll in a run"),
      h('small', "Select a time that works for you")
    ]),
    h(Box, {gap: 8}, validInstances
      .map((instance, index)=>{
      return h(Item, {
        onClick: ()=> setSelection(index === selection ? null : index)
      }, [
        h(Radio, {
          id: instance.id,
          readOnly: true,
          type: 'radio',
          checked: selection === index
        }),
        h('div', {style:{justifySelf: 'left'}}, [
          h(Label, [prettyDate(instance.start_date), ' - ', prettyDate(instance.end_date)]),
          h('p', 'facillitated by ' + instance.people?.display_name)
        ])
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

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

let Item = styled('div')`
display: grid;
grid-template-columns: auto auto;
align-items: center;
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
