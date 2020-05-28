import useSWR from 'swr'
import {callApi, Success} from './apiHelpers'
import { CourseResult, InstanceResult, UserInstancesResult, WhoAmIResult, CourseDataResult, ProfileResult} from '../pages/api/get/[...item]'
export const useUserData = ()=>{
  return useSWR('/api/get/whoami', async (api) => {
    let res = await callApi<null, WhoAmIResult>(api)
    return res.result
  })
}

export const useProfileData = (username:string, initialData?:Success<ProfileResult>)=>{
  return useSWR('/api/get/profile/'+username, async api =>{
    let res = await callApi<null, ProfileResult>(api)
    if(res.status===200) return res.result
    else return false
  }, {initialData})
}

export const useCourseData = (id: string, initialData?:Success<CourseDataResult>) => {
  return useSWR('/api/get/course/' + id, async api => {
    let res = await callApi<null, CourseDataResult>(api)
    if(res.status === 200) return res.result
  }, {initialData})
}

export const useInstanceData = (id: string, initialData?:Success<InstanceResult>) => {
  return useSWR('/api/get/instance/' + id, async api => {
    let res = await callApi<null, InstanceResult>(api)
    if(res.status === 200) return res.result
    else return false
  }, {initialData})
}

export const useUserInstances = () => {
  return useSWR('/api/get/user_instances', async(api) => {
    let res = await callApi<null, UserInstancesResult>(api)
    if(res.status===200) return res.result
  })
}

export const useCourses = (initialData?:Success<CourseResult>) => {
  return useSWR('/api/get/courses', async (api) => {
    let res = await callApi<null, CourseResult>(api)
    return res.result
  }, {initialData})
}
