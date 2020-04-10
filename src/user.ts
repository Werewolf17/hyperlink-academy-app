import useSWR from 'swr'
import {WhoAmIResponse} from '../pages/api/whoami'
import {Result as GetInstancesResult} from '../pages/api/courses/getInstances'
import {Result as CourseResult} from '../pages/api/courses/getCourses'
export const useUserData = ()=>{
  return useSWR('/api/whoami', async (api) => {
    let res = await fetch(api)
    let result:WhoAmIResponse = await res.json()
    return result
  })
}

export const useUserInstances = () => {
  return useSWR('/api/courses/getInstances', async(api) => {
    let res = await fetch(api)
    if(res.status===200) return await res.json() as GetInstancesResult
  })
}

export const useCourses = () => {
  return useSWR('/api/courses/getCourses', async (api) => {
    let res = await fetch(api)
    return await res.json() as CourseResult
  })
}
