import { NextApiRequest, NextApiResponse} from 'next'
import {PrismaClient} from '@prisma/client'
import hmac from '../../src/hmac'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export type Msg = {
  key: string
  password: string
}

export type Response = {
  success: boolean
}

async function getResetKey(hash: string) {
  return prisma.password_reset_keys.findOne({where:{key_hash:hash}})
}

export default async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  let msg: Partial<Msg> = JSON.parse(req.body)
  if(!msg.key || !msg.password) {
    res.json({success: false})
    return res.end()
  }

  let hash = hmac(msg.key)
  let resetKey = await getResetKey(hash)
  if(!resetKey) return res.json({success:false})

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

export async function updatePassword(email: string, newPassword: string, key_hash: string) {
  let password_hash = await bcrypt.hash(newPassword, await bcrypt.genSalt())

  await prisma.password_reset_keys.delete({where:{key_hash}})
  return prisma.people.update({where:{email}, data:{password_hash}})
}
