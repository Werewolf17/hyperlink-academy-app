import useSWR from 'swr'
import {CourseResult, InstanceResult, WhoAmIResult} from '../pages/api/get/[item]'
export const useUserData = ()=>{
  return useSWR('/api/get/whoami', async (api) => {
    let res = await fetch(api)
    let result:WhoAmIResult = await res.json()
    return result
  })
}

export const useUserInstances = () => {
  return useSWR('/api/get/user_instances', async(api) => {
    let res = await fetch(api)
    if(res.status===200) return await res.json() as InstanceResult
  })
}

export const useCourses = () => {
  return useSWR('/api/get/courses', async (api) => {
    let res = await fetch(api)
    return await res.json() as CourseResult
  })
}
