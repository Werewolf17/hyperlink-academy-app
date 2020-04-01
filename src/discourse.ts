import fetch from 'isomorphic-unfetch'

let authHeaders = {
      "Api-Key": process.env.DISCOURSE_API_KEY || '',
      "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
    }

export const getUsername = async (userId:string):Promise<string | undefined> => {
  let result = await fetch('https://forum.hyperlink.academy/u/by-external/' + userId + '.json', {
    method: "GET",
    headers: {
      ...authHeaders
    }
  })

  if(result.status === 200) {
    return (await result.json()).user.username as string
  }
  else return
}

export const getGroupId = async (groupName:string) => {
  let result = await fetch('https://forum.hyperlink.academy/groups/' + groupName + '.json', {
    method: "GET",
    headers: {
      "Api-Key": process.env.DISCOURSE_API_KEY || '',
      "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
    }
  })
  if(result.status === 200) return (await result.json()).group.id
  return undefined
}

export const addMember = async (groupId:string, username: string) => {
      let result = await fetch(`https://forum.hyperlink.academy/groups/${groupId}/members.json`, {
        method: "PUT",
        headers: {
          "Api-Key": process.env.DISCOURSE_API_KEY || '',
          "Api-Username": process.env.DISCOURSE_API_USERNAME || '',
          "Content-Type": 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          usernames: username
        })
      })
  return result.status  === 200
}
