import {APIHandler, ResultType, Request} from '../../src/apiHelpers'
import {setTokenHeader, getToken} from '../../src/token'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  forceTransactions: true
})

export type Msg = {
  display_name?: string,
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

  if(body?.password) {
    if(await validateLogin(user.email, body.password.old)) {
      await updatePassword(user.email, body.password.new)
    }
    else {
      return {status: 401 as const, result: "Error: Incorrect password" as const}
    }
  }

  if(body?.display_name) {
    let newData = await updatePerson(user.id, body.display_name)
    setHeaders = setTokenHeader({...user, display_name:newData.display_name})
  }

  return {
    status: 200,
    result: '',
    headers: setHeaders
  } as const
}


export default APIHandler(handler)

async function updatePerson(id:string, display_name:string) {
  return await prisma.people.update({
    where:{id},
    data:{display_name}
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
