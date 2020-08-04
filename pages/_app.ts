import h from 'react-hyperscript'
import Head from 'next/head'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'
import Layout from '../components/Layout';
import * as Sentry from '@sentry/node'

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
  return h(Elements, {stripe:stripePromise},[
    h(Head, {children: [
      h('title', 'hyperlink.academy'),
      h('meta', {property:"og:title", content:'hyperlink.academy', key:"title"}),
      h('meta', {property:"og:description", content:'a course platform and online school built for seriously effective learning', key:"title"}),
      h('meta', {property: "og:image", content: 'https://hyperlink.academy/img/social-logo.png', key: "image"}),
    ]}, ),
    h(Layout, {}, [h(Component, {...pageProps})])
  ])
}

export default App
