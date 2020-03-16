import { NextApiRequest, NextApiResponse} from 'next'
import {setToken} from '../../src/token'
import {client} from '../../src/db'
import {User} from './verifyEmail'
import {query as q} from 'faunadb'
import bcrypt from 'bcryptjs'

export type Msg = {
  email: string
  password: string
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email || !msg.password) {
    res.status(402)
    return res.end()
  }
  let id = await validateLogin(msg.email, msg.password)
  if(id) {
    setToken(res, {email:msg.email, id})
    res.end()
  }
  else {
    res.status(401)
    return res.end()
  }
}

async function validateLogin(email: string, password: string):Promise<false | string> {
  try {
    let {data} = (await client.query(q.Get(q.Match(q.Index('personByEmail'),email)))) as {data: User}
    if(await bcrypt.compare(password, data.hash)) return false
    return data.id
  } catch (e) {
    return false
  }
}
