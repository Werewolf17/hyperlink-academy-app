import h from 'react-hyperscript'
import {useStripe} from '@stripe/react-stripe-js'
import {course_instances} from '@prisma/client'
import { useRouter } from 'next/router'

import {Section} from '../Section'
import {Msg, Response} from '../../pages/api/courses/enroll'
import { useUserContext } from '../../pages/_app'

type Props = {
  instances: Array<course_instances>
}

export default (props: Props) => {
  const stripe = useStripe();
  let router = useRouter()
  let user = useUserContext()

  return h(Section, {legend:"Enroll"}, props.instances.map(instance => {
    return h('div', [
      h('h3', '$' + instance.cost),
      h('h4', `${instance.start_date}  - ${instance.end_date}`),
      h('button', {
        onClick: async () => {
          if(!user) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
          if(!stripe) return
          let msg:Msg = {instanceID: instance.id}
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
        }
      }, 'enroll')
    ])
  })
  )
}
