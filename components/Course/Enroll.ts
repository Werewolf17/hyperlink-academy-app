import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {EnrollMsg, EnrollResponse} from '../../pages/api/courses/[action]'
import { Primary} from '../Button'
import { Box} from '../Layout'
import {colors} from '../Tokens'
import Loader from '../Loader'
import { useUserData, useInstanceData} from '../../src/data'
import { callApi } from '../../src/apiHelpers'
import { Error } from '../Form'

type Props = {
  id: string,
}

const Enroll = (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)

  let {data:user} = useUserData()
  let {data: instance} = useInstanceData(props.id)

  if(user === undefined || instance === undefined) return null
  if(instance === false) return h('div', h(Error, 'No instance found'))

  const onSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()

    if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
    if(!stripe) return

    setLoading(true)
    let res = await callApi<EnrollMsg, EnrollResponse>('/api/courses/enroll', {
      instanceID: props.id
    })
    if(res.status === 200) await stripe.redirectToCheckout({sessionId: res.result.sessionId})
    setLoading(false)
  }

  return h(Box, {gap: 16}, [
    h('div', [
      h(Cost, '$' + instance.courses.cost),
      h('b', instance.courses.duration)
    ]),
    h(Divider),
    h(Box, {as: "form", onSubmit}, [
      h(Label, [prettyDate(instance.start_date)]),
      h('p', 'facillitated by ' + instance.people?.display_name),
      h(Primary, {
        style: {width: '100%'},
      }, loading ? h(Loader) : 'Enroll'),
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

let Divider = styled('hr')`
color: ${colors.grey55};
border-style: dashed;
`
