import {APIHandler, ResultType, Request} from '../../src/apiHelpers'
import {setTokenHeader, getToken} from '../../src/token'
import {syncSSO} from '../../src/discourse'
import { PrismaClient, people} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  forceTransactions: true
})

export type Msg = {
  profile?: {
    display_name?: string,
    link?: string,
    bio?: string,
  },
  password?: {
    new: string,
    old: string
  },
}

export type Result = ResultType<typeof handler>

const handler = async (req: Request) => {
  let body = req.body as Partial<Msg>
  let user = getToken(req)
  if(!user) {
    return {
      status: 400 as const,
      result: "Error: No user signed in" as const
    }
  }

  let setHeaders
  if(body.password) {
    if(await validateLogin(user.email, body.password.old)) {
      await updatePassword(user.email, body.password.new)
    }
    else {
      return {status: 401 as const, result: "Error: Incorrect password" as const}
    }
  }

  if(body.profile) {
    let data = {display_name: body.profile.display_name, link: body.profile.link, bio: body.profile.bio}
    let newData = await updatePerson(user.id, data)
    setHeaders = setTokenHeader({...user, ...data})
    await syncSSO({
      external_id: user.id,
      email: user.email,
      name: newData.display_name || '',
      website: newData.link || ''
    })
  }


  return {
    status: 200,
    result: '',
    headers: setHeaders
  } as const
}


export default APIHandler(handler)

async function updatePerson(id:string, data: Partial<people>) {
  return await prisma.people.update({
    where:{id},
    data
  })
}

async function validateLogin(email: string, password: string):Promise<boolean> {
  try {
    let person = await prisma.people.findOne({where:{email}})
    if(!person) return false
    return await bcrypt.compare(password, person.password_hash)
  } catch (e) {
    return false
  }
}

async function updatePassword(email: string, newPassword: string) {
  let password_hash= await bcrypt.hash(newPassword, await bcrypt.genSalt())
  await prisma.people.update({where:{email}, data:{password_hash}})
}
