import Document, { Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

export default class MyDocument extends Document {
  static getInitialProps ({ renderPage }) {
    const sheet = new ServerStyleSheet()
    const page = renderPage(App => props => sheet.collectStyles(<App {...props} />))
    const styleTags = sheet.getStyleElement()
    return { ...page, styleTags }
  }

  render () {
    return (
      <html lang="en">
        <Head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo="/>
        <link rel="canonical" href="https://hyperlink.academy/"/>
        {this.props.styleTags}

        </Head>
        <body style={{
          margin: "0px",
        }}>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
