import { NextApiRequest, NextApiResponse} from 'next'
import {getToken, Token} from '../../src/token'
export type WhoAmIResponse = Token | false
export default async (req: NextApiRequest, res: NextApiResponse<WhoAmIResponse>) => {
  return res.json(getToken(req) || false)
}
