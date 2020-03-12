import { NextApiRequest, NextApiResponse} from 'next'
import {getToken} from '../../src/token'
import {client} from '../../src/db'
import {query as q} from 'faunadb'
import bcrypt from 'bcryptjs'

type Msg = {
  oldPassword: string
  newPassword: string
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.oldPassword || !msg.newPassword) {
    return res.status(402).end()
  }
  let user = getToken(req)
  if(!user) {
    return res.status(402).end()
  }

  if(await validateLogin(user, msg.oldPassword)) {
    await updatePassword(user, msg.newPassword)
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

async function updatePassword(email: string, newPassword: string) {
  let hash = await bcrypt.hash(newPassword, await bcrypt.genSalt())
  console.log(hash)

  return client.query(q.Update(
    q.Select( 'ref', q.Get(q.Match(q.Index('personByEmail'), email))),
    {data: {hash}}
  ))
}
