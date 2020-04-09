import h from 'react-hyperscript'
import {useStripe} from '@stripe/react-stripe-js'
import {course_instances} from '@prisma/client'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {Msg, Response} from '../../pages/api/courses/enroll'
import { useUserContext } from '../../pages/_app'
import {Primary} from '../Button'
import Loader from '../Loader'


type Props = {
  instances: Array<course_instances>
}

export default (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let [loading, setLoading] = useState(false)
  let user = useUserContext()

  return h(Primary, {
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
}
