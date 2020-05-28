import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html lang="en">
        <Head>
          <link rel="icon" href="/img/favicon.png"/>
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
