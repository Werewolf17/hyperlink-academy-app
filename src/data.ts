import useSWR from 'swr'
import {callApi, Successful} from './apiHelpers'
import { CourseResult, InstanceResult, UserInstancesResult, WhoAmIResult, CourseDataResult} from '../pages/api/get/[...item]'
export const useUserData = ()=>{
  return useSWR('/api/get/whoami', async (api) => {
    let res = await callApi<null, WhoAmIResult>(api)
    return res.result
  })
}

export const useCourseData = (id: string, initialData?:Successful<CourseDataResult>) => {
  return useSWR('/api/get/course/' + id, async api => {
    let res = await callApi<null, CourseDataResult>(api)
    if(res.status === 200) return res.result
  }, {initialData})
}

export const useInstanceData = (id: string) => {
  return useSWR('/api/get/instance/' + id, async api => {
    let res = await callApi<null, InstanceResult>(api)
    if(res.status === 200) return res.result
    else return false
  })
}

export const useUserInstances = () => {
  return useSWR('/api/get/user_instances', async(api) => {
    let res = await callApi<null, UserInstancesResult>(api)
    if(res.status===200) return res.result
  })
}

export const useCourses = (initialData?:Successful<CourseResult>) => {
  return useSWR('/api/get/courses', async (api) => {
    let res = await callApi<null, CourseResult>(api)
    return res.result
  }, {initialData})
}
