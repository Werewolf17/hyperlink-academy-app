import h from 'react-hyperscript'
import Head from 'next/head'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'
import Layout from '../components/Layout';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY as string);

type Props = {
  Component: any,
  pageProps: any
}

const App = ({ Component, pageProps}:Props) => {

  return h(Elements, {stripe:stripePromise},[
           h(Head, {children: []}, h('title', 'hyperlink.academy')),
           h(Layout, {}, [h(Component, {...pageProps})])
          ])
}

export default App
