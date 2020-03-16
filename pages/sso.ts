import h from 'react-hyperscript'
import crypto from 'crypto'
import querystring from 'querystring'
import {useRouter} from 'next/router'
import {getToken} from '../src/token'
import { GetServerSideProps } from 'next'

type Props = {error:boolean}
export default ({error}:Props) => {
  let router = useRouter()
  let {sso, sig} = router.query

  if(!sso || !sig) return h('div', 'Invalid SSO parameters!')

  if(error) return h('p', 'An error occured, please check with the reffering site')

  return h('h1', 'Logging you onto discourse...')
}

export const getServerSideProps:GetServerSideProps = async ({req,res, query}) => {
  let token = getToken(req)
  if(!token) {
    res.writeHead(301, {Location: '/login?redirect='+encodeURIComponent(req.url as string)})
    res.end()
    return {props:{}}
  }
  let {sso, sig} = query

  const hmac1 = crypto.createHmac('sha256', process.env.DISCOURSE_SECRET || '');
  hmac1.update(Buffer.from(sso))

  let verifySig = hmac1.digest('hex')
  if(verifySig !== sig) {
    return  {
      props: {
        error: true
      }
    }
  }

  let {nonce} = querystring.parse(Buffer.from(sso as string, 'base64').toString())
  let newPayload = querystring.stringify({
    nonce,
    email:token.email,
    external_id: token.id
  })

  let base64Payload = (Buffer.from(newPayload)).toString('base64')

  const hmac2 = crypto.createHmac('sha256', process.env.DISCOURSE_SECRET || '');
  hmac2.update(base64Payload)

  res.writeHead(301, {
    Location: "https://forum.hyperlink.academy/session/sso_login?"
      + querystring.stringify({
        sso: base64Payload,
        sig: hmac2.digest('hex')
      })
  })
  res.end()
  return {props:{}}

}
