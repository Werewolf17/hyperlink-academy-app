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
  let [state, setState] = useState<'loading' | 'not found' | 'used'>('loading')
  useEffect(()=>{
    (async function(){
      if(!router.query.discount) return
      let code = router.query.discount
      let res = await callApi<null, GetDiscountResult>('/api/discounts/'+code)
      if(res.status !== 200) { return setState('not found')}
      let discount  = res.result
      console.log(discount)
      if(discount.max_redeems !== 0 && discount.max_redeems <= discount.redeems) {
        return setState('used')
      }

      let discounts = getDiscounts()
      setDiscounts([...discounts.filter(d=> d.course !== discount.course), {
        ...discount,
        date_added: new Date().toISOString(),
      }])
      router.push('/courses/[slug]/[id]', `/courses/${discount.courses.slug}/${discount.courses.id}`)
    })()
  }, [router.query.discount])
  if(state === 'loading') return h(PageLoader)
  if(state === 'used') return h(Box, {style: {textAlign: "center"}}, [
    h('h2', "Sorry"),
    h('p.big', 'That discount code has been fully used up'),
    h(Link, {href: '/'}, h('a', "take me to the homepage"))
  ])

  return  h(Box, {style:{textAlign: 'center'}}, [
    h('h2', "Sorry "),
    h('p.big', 'That discount code is invalid'),
    h(Link, {href: '/'}, h('a', "take me to the homepage"))
  ])
}
