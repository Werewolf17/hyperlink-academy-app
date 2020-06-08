import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import { InferGetStaticPropsType } from 'next'

import { Error } from '../../components/Form'
import Loader from '../../components/Loader'
import { Box } from '../../components/Layout'
import {profileDataQuery} from '../api/get/[...item]'

import { useProfileData } from '../../src/data'
import { colors } from '../../components/Tokens'
import ErrorPage from '../404'
import Text from '../../components/Text'

type Props = InferGetStaticPropsType<typeof getStaticProps>

export default (props: Props)=> props.notFound ? h(ErrorPage) : h(Profile, props)

const Profile= (props: Extract<Props, {notFound: false}>)=>{
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
    !person.bio ? null : h(Box, {width: 640}, h(Text, {source: person.bio}))
  ])
}

export const getStaticProps = async (ctx:any)=>{
  let username = ctx.params?.username as string
  let data = await profileDataQuery(username)

  if(!data) return {props: {notFound: true}} as const

  return {props: {notFound: false, ...data}, unstable_revalidate:1} as const
}

export const getStaticPaths = async ()=>{
  return {paths:[], fallback: true}
}
