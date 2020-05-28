import h from 'react-hyperscript'
import { useRouter } from 'next/router'

import { Error } from '../../components/Form'
import Loader from '../../components/Loader'
import { Box } from '../../components/Layout'
import {profileDataQuery} from '../api/get/[...item]'

import { useProfileData } from '../../src/data'
import { colors } from '../../components/Tokens'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const Profile= (props: Props)=>{
  let router = useRouter()
  let username = router.query.username as string
  let {data: person} = useProfileData(username, props || undefined)
  if(person === undefined) return h(Loader)
  if(person === false) return h(Error, 'No user found :(')

  return h(Box, {gap: 32}, [
    h(Box, {gap: 8}, [
      h('h1', person.display_name || username),
      h('b', {style: {color: colors.textSecondary}}, `@${username}`),
      !person.link ? null : h('a', {href: person.link}, h('b', person.link)),
    ]),
    !person.bio ? null : h('div', person.bio)
  ])
}

export const getStaticProps = async (ctx:any)=>{
  let username = ctx.params?.username as string
  if(!username) return {
    props:undefined,
    unstable_revalidate: 1
  }
  let data = await profileDataQuery(username)
  return {props: data, unstable_revalidate:1}
}

export const getStaticPaths = async ()=>{
  return {paths:[], fallback: true}
}

export default Profile
