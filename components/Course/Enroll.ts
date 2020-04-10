import h from 'react-hyperscript'
import {useStripe} from '@stripe/react-stripe-js'
import { useRouter } from 'next/router'
import { useState, Fragment } from 'react'

import {Msg, Response} from '../../pages/api/courses/enroll'
import { Primary} from '../Button'
import Loader from '../Loader'
import {CourseData} from '../../src/course'
import {useUserData, useUserInstances} from '../../src/user'

type Props = {
  instances: CourseData['course_instances']
}

export default (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)

  let {data:user} = useUserData()
  let {data: instances} = useUserInstances()

  if(user === undefined || instances === undefined) return h(Primary, {}, h(Loader))

  let userInNextInstance = instances && instances.course_instances.find(instance => instance.id === props.instances[0].id)
  if(userInNextInstance) return h('a', {
    href: 'https://forum.hyperlink.academy/g/' + props.instances[0].id
  }, h(Primary, 'Your instance group'))

  let start_date = new Date(props.instances[0].start_date)
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  return h(Fragment , [
     h('h3', `The next instance starts ${start_date}`),
    h(Primary, {
      onClick: async ()=>{
        if(!user) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
        if(!stripe) return
        setLoading(true)
        let msg:Msg = {instanceID: props.instances[0].id}
        let res = await fetch('/api/courses/enroll', {
          method: "POST",
          body: JSON.stringify(msg)
        })
        if(res.status === 200) {
          let {sessionId}= await res.json() as Response
          stripe.redirectToCheckout({
            sessionId
          })
        }
        setLoading(false)
      }
    }, loading ? h(Loader) : 'Enroll')
  ])
}
