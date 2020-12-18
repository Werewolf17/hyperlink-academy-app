import h from 'react-hyperscript'
import { InferGetStaticPropsType } from "next"
import { cohortDataQuery } from "pages/api/cohorts/[cohortId]"
import { getTaggedPost } from "src/discourse"
import ErrorPage from 'pages/404'
import { Box } from 'components/Layout'
import { PageLoader } from 'components/Loader'
import { useUserData } from 'src/data'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

type Props = InferGetStaticPropsType<typeof getStaticProps>
export default function WrappedSettingsPage(props:Props) {return props.notFound ? h(ErrorPage) : h(CohortSettingsPage, props)}
const CohortSettingsPage= (props: Extract<Props, {notFound:false}>) => {
  let {data: user} = useUserData()
  let router = useRouter()
  useEffect(()=>{
    if(!props.cohort || user === undefined) return
    else if(user===false) router.push('/')
    else if(props.cohort.facilitator!== user.id) router.push('/dashboard')
  },[user, props.cohort])
  if(!props.cohort) return h(PageLoader)
  return h(Box, [
    h('h1', "Cohort Settings"),
    h('h4', `Cohort #${props.cohort.name}`)
  ])
}

export const getStaticProps = async (ctx:any)=>{
  let cohortId = parseInt(ctx.params?.cohortId as string || '')
  if(Number.isNaN(cohortId)) return {props:{notFound: true}} as const
  let cohort = await cohortDataQuery(cohortId)

  if(!cohort) return {props: {notFound: true}} as const

  let cohort_events = cohort.cohort_events
    .filter(c=>c.everyone)
    .map(event =>{
      return {...event, events: {...event.events, location: ''}}
  })

  let [notes] = await Promise.all([
    getTaggedPost(cohort.category_id, 'note'),
  ])
  return {
    props: {
      notFound: false,
      cohortId,
      cohort: {...cohort, cohort_events},
      notes,
    },
    revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
