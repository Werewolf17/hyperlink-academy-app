import NextApp, { AppContext } from 'next/app'
import h from 'react-hyperscript'
import Head from 'next/head'
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js'
import {getToken, Token} from '../src/token'
import { useEffect, useState, createContext, useContext} from 'react'
import Layout from '../components/Layout';

const stripePromise = loadStripe('pk_test_LOqCqstM6XCEHlA3kVEqBBqq006vmeRRkS');


export const UserContext = createContext<Token | undefined>(undefined);
export const useUserContext = ()=>{
  return useContext(UserContext)
}

type Props = {
  user?: Token
  Component: any,
  pageProps: any
}

const App = ({ Component, pageProps, user}:Props) => {
  let [state, setState] = useState({user})

  useEffect(() => {
    // Update user state in local storage
    if(user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    else {
      localStorage.removeItem('user')
    }
    setState({user})

    // Listen for storage events triggered from other tabs
    let listener = (e:StorageEvent) => {
      if(e.key !== 'user') return
      if(e.newValue) {
        let newUser = JSON.parse(e.newValue || '{}')
        setState({user: newUser})
      } else {
        setState({user:undefined})
      }
    }

    window.addEventListener('storage', listener)
    return ()=>{
      window.removeEventListener('storage', listener)
    }
  }, [user])

  return h(Elements, {stripe:stripePromise},
           h(UserContext.Provider, {value: state.user}, [
             h(Head, {children: []}, h('title', 'hyperlink.academy')),
             h(Layout, {}, [h(Component, {...pageProps, ...state})])
           ])
          )
}

App.getInitialProps = async (appContext:AppContext) => {
    let {req} = appContext.ctx
    const appProps = await NextApp.getInitialProps(appContext)
    let user: Token | undefined

    if(req) {
      user = getToken(req)
    }
    else {
      let storedUserData = localStorage.getItem('user')
      if(storedUserData) user = JSON.parse(storedUserData)
    }
    return {...appProps, user}
}

export default App
