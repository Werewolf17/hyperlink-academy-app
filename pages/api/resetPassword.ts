import { NextApiRequest, NextApiResponse} from 'next'
import {query as q} from 'faunadb'
import {client} from '../../src/db'
import {ResetKey} from './requestResetPassword'
import hmac from '../../src/hmac'
import bcrypt from 'bcryptjs'

export type Msg = {
  key: string
  password: string
}

export type Response = {
  success: boolean
}

async function getResetKey(hash: string) {
  let {data} = await client.query(q.Get(q.Match(q.Index('resetKeyByHash'), hash)))
  return data as ResetKey
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.key || !msg.password) {
    res.json({success: false})
    return res.end()
  }

  let hash = hmac(msg.key)
  let resetKey = await getResetKey(hash)

  let date = new Date(resetKey.time)

  if((Date.now() - date.getTime())/(1000 * 60) > 30)  {
    return res.json({success:false})
  }

  try {
    await updatePassword(resetKey.email, msg.password, hash)
    return res.json({success:true})
  }
  catch (e){
    console.log(e)
    return res.json({success:false})
  }
}

export async function updatePassword(email: string, newPassword: string, resetHash: string) {
  let hash = await bcrypt.hash(newPassword, await bcrypt.genSalt())
  return client.query(q.Do([
    q.Delete(q.Select('ref', q.Get(q.Match(q.Index('resetKeyByHash'), resetHash)))),
    q.Update(
      q.Select( 'ref', q.Get(q.Match(q.Index('personByEmail'), email))),
      {data: {hash}}
    )
  ]))
}
