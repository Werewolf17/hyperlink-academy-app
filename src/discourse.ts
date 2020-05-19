import crypto from 'crypto'
import querystring from 'querystring'

let headers = {
      "Api-Key": process.env.DISCOURSE_API_KEY || '',
      "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
    }

export type Category = {
  topic_list: {
    topics: Array<{
      id: string
      pinned: boolean
    }>
  }
}

export const createInstanceGroup = async (name: string, admin: string, courseID: number) => {
  let username = await getUsername(admin)
  console.log(username)
  if(!username) return false
  let result = await fetch('https://forum.hyperlink.academy/admin/groups', {
    method: 'POST',
    headers: {
      ...headers,
      "Content-Type": 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      group: {
        name,
        visibility_level: 2,
        owner_usernames: username
      }
    })
  })
  if(result.status !== 200) {
    console.log(await result.text())
    return false
  }
  await createCategory(name, {permissions: {[name]:1}, parent_category_id: courseID})
}

export const createCategory = async (name: string, options?: {id?: string,permissions?: {[key:string]:number}, parent_category_id?: number}):Promise<number | false> => {
  let result = await fetch('https://forum.hyperlink.academy/categories.json', {
    method: 'POST',
    headers: {
      ...headers,
      "Content-Type": 'application/json; charset=utf-8'
    },
    body: JSON.stringify({name, color: '0088CC', text_color: 'FFFFFF', ...options})
  })
  if(result.status === 200) return (await result.json()).category.id as number
  console.log(await result.text())
  return false
}

export const getUsername = async (userId:string):Promise<string | undefined> => {
  let result = await fetch('https://forum.hyperlink.academy/u/by-external/' + userId + '.json', {
    method: "GET",
    headers
  })

  if(result.status === 200) {
    return (await result.json()).user.username as string
  }
  else return
}

export const getGroupId = async (groupName:string) => {
  let result = await fetch('https://forum.hyperlink.academy/groups/' + groupName + '.json', {
    method: "GET",
    headers
  })
  if(result.status === 200) return (await result.json()).group.id
  return undefined
}

export const addMember = async (groupId:string, username: string) => {
      let result = await fetch(`https://forum.hyperlink.academy/groups/${groupId}/members.json`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          usernames: username
        })
      })
  return result.status  === 200
}

export const makeSSOPayload = (params: {[key:string]: string}) => {
  let payload = (Buffer.from(querystring.stringify(params))).toString('base64')
  const sig = crypto.createHmac('sha256', process.env.DISCOURSE_SECRET || '');
  sig.update(payload)

  let result = querystring.stringify({
    sso:payload,
    sig: sig.digest('hex')
  })
  return result
}

export const syncSSO = async (params: {[key:string]: string})=>{
  let payload = (Buffer.from(querystring.stringify(params))).toString('base64')
  const sig = crypto.createHmac('sha256', process.env.DISCOURSE_SECRET || '');

  sig.update(payload)
  return fetch(`https://forum.hyperlink.academy/admin/users/sync_sso`, {
    method: "POST",
    headers: {
      "Api-Key": process.env.DISCOURSE_API_KEY || '',
      "Api-Username": 'system',
      "Content-Type": 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      sso: payload,
      sig: sig.digest('hex')
    })
  })
}
