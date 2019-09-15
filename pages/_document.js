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

        <script dangerouslySetInnerHTML={{__html: `
            (function(f, a, t, h, o, m){
              a[h]=a[h]||function(){
                (a[h].q=a[h].q||[]).push(arguments)
              };
              o=f.createElement('script'),
              m=f.getElementsByTagName('script')[0];
              o.async=1; o.src=t; o.id='fathom-script';
              m.parentNode.insertBefore(o,m)
            })(document, window, '//oiu.sh/tracker.js', 'fathom');
          fathom('set', 'siteId', 'PVEVR');
          fathom('trackPageview');
          `
                                         }}>
        </script>
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
