import h from 'react-hyperscript'
import Head from 'next/head'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'
import Layout from '../components/Layout';
import * as Sentry from '@sentry/node'
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useCourseData } from 'src/data';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY as string);

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  })
}

type Props = {
  Component: any,
  pageProps: any
}

const App = ({ Component, pageProps}:Props) => {
  let router = useRouter()
  let {data:course} = useCourseData((router.query.id as string)?.split('-').slice(-1)[0])
  useEffect(()=>{
    if(!course) return
    let nameAndId = `${course.slug}-${course.id}`
    if(router.query.id !== nameAndId) {
      let newRoute = router.asPath.replace('courses/'+router.query.id, `courses/${nameAndId}`)
      router.replace(router.route, newRoute, {shallow: true})
    }
  },[course, router.asPath])

  return h(Elements, {stripe:stripePromise},[
    h(Head, {children: []}, h('title', 'hyperlink.academy')),
    h(Layout, {}, [h(Component, {...pageProps})])
  ])
}

export default App
