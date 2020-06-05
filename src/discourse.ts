import crypto from 'crypto'
import querystring from 'querystring'
import TemplateCohortNotes from '../writing/TemplateCohortNotes.txt'
import TemplateCohortGettingStarted from '../writing/TemplateCohortGettingStarted.txt'

let headers = {
      "Api-Key": process.env.DISCOURSE_API_KEY || '',
      "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
    }

export type Category = {
  topic_list: {
    topics: Array<{
      id: string
      pinned: boolean
      tags: string[]
    }>
  }
}

export const createCohortGroup = async (name: string, admin: string, courseID: number) => {
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
  let category = await createCategory(name, {permissions: {[name]:1}, parent_category_id: courseID})
  if(!category) return false
  await createTopic({
    category,
    title: name + " Notes",
    raw: TemplateCohortNotes,
    tags: ['note']
  })

  await createTopic({
    category,
    title: name + " Getting Started",
    raw: TemplateCohortGettingStarted,
    tags: ['note']
  })
  return true
}

export async function createTopic(input:{title: string, category: number, raw: string, tags?: string[]}) {
  let result = await fetch('https://forum.hyperlink.academy/posts.json', {
    method: "POST",
    headers: {
      "Content-Type": 'application/json; charset=utf-8',
      ...headers
    },
    body: JSON.stringify({...input})
  })
  console.log(result)
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

export const getTaggedPost = async (c: string, tag: string) => {
  let res = await fetch(`https://forum.hyperlink.academy/c/${c}.json`, {
    method: 'GET',
    headers: {
      ...headers,
      "Content-Type": 'application/json; charset=utf-8',
    },
  })

  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find((topic) => topic.tags.includes(tag))?.id
  if(!topicID) return {text: '', id: ''}
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID, {headers})
  return {text: await topicRequest.text(), id: topicID}
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
