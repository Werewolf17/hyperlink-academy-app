import h from 'react-hyperscript'
import Head from 'next/head'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'
import Layout from '../components/Layout';

const stripePromise = loadStripe('pk_test_LOqCqstM6XCEHlA3kVEqBBqq006vmeRRkS');

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
