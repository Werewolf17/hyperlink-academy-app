import useSWR from 'swr'
import {callApi} from './apiHelpers'
import {CourseResult, InstanceResult, WhoAmIResult} from '../pages/api/get/[item]'
export const useUserData = ()=>{
  return useSWR('/api/get/whoami', async (api) => {
    let res = await callApi<null, WhoAmIResult>(api)
    return res.result
  })
}

export const useUserInstances = () => {
  return useSWR('/api/get/user_instances', async(api) => {
    let res = await callApi<null, InstanceResult>(api)
    if(res.status===200) return res.result
  })
}

export const useCourses = () => {
  return useSWR('/api/get/courses', async (api) => {
    let res = await callApi<null, CourseResult>(api)
    return res.result
  })
}
