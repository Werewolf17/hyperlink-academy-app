import h from 'react-hyperscript'
import { useRouter } from "next/router"
import { useEffect, useState } from 'react'
import { callApi } from 'src/apiHelpers'
import {GetDiscountResult} from 'pages/api/discounts/[code]'
import {getDiscounts, setDiscounts} from 'src/clientData'
import { PageLoader } from 'components/Loader'
import { Box } from 'components/Layout'
import Link from 'next/link'

export default ()=>{
  let router= useRouter()
  let [state, setState] = useState<'loading' | 'not found'>('loading')
  useEffect(()=>{
    (async function(){
      if(!router.query.discount) return
      let code = router.query.discount
      let res = await callApi<null, GetDiscountResult>('/api/discounts/'+code)
      if(res.status !== 200) { return setState('not found')}
      let discount  = res.result
      let discounts = getDiscounts()
      setDiscounts([...discounts.filter(d=> d.course !== discount.course), {
        ...discount,
        date_added: new Date().toISOString(),
      }])
      router.push('/courses/[slug]/[id]', `/courses/${discount.courses.slug}/${discount.courses.id}`)
    })()
  }, [router.query.discount])
  if(state === 'loading') return h(PageLoader)
  return  h(Box, {style:{textAlign: 'center'}}, [
    h('h2', "Sorry "),
    h('p.big', 'That discount code is invalid'),
    h(Link, {href: '/'}, h('a', "take me to the homepage"))
  ])
}
