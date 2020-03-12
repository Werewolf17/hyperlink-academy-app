import { NextApiRequest, NextApiResponse} from 'next'
import {setToken} from '../../src/token'
import {client} from '../../src/db'
import {query as q} from 'faunadb'
import bcrypt from 'bcryptjs'

type Msg = {
  email: string
  password: string
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.email || !msg.password) {
    res.status(402)
    return res.end()
  }
  if(await validateLogin(msg.email, msg.password)) {
    setToken(res, msg.email)
    res.end()
  }
  else {
    res.status(401)
    return res.end()
  }
}

async function validateLogin(email: string, password: string):Promise<boolean> {
  try {
    let hash = await client.query(q.Select(['data', 'hash'],
                                           q.Get(
                                             q.Match(q.Index('personByEmail'),
                                                     email)))) as string
    return await bcrypt.compare(password, hash)
  } catch (e) {
    return false
  }
}
