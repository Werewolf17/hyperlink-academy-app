import React from 'react'
import NextApp from 'next/app'
import styled from 'styled-components'
import {useRouter} from 'next/router'
import Head from 'next/head'

const Layout = styled('div')`
margin: auto;
max-width: 700px;
font-size: 20px;
padding: 10px;

a:visited {
  color: blue;
}
`

export default class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props
    return (
      <Layout>
        <Head><title> hyperlink.academy</title></Head>
        <h1><a href='/'>hyperlink.academy</a></h1>
        <Component {...pageProps} />
        <br/>
        <hr/>
        <div style={{textAlign: 'right'}}>
          a <a href='fathom.network'>fathom</a> project
          <br/>
          read the <a href='/rationale'>rationale</a>
        </div>
      </Layout>
    )
  }
}

export const EditLink = () => {
  let router = useRouter()
  let location = router.pathname.replace(/\/$/, "")
  return (<a href = {'https://gitlab.com/-/ide/project/jaredpereira/hyperlink-academy/edit/master/-/pages' + location + '.md'}>edit this page</a>)
}
