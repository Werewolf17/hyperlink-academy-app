import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import {InferGetStaticPropsType} from 'next'
import Link from 'next/link'

import { Box, TwoColumn, Sidebar, Seperator } from '../../../components/Layout'
import Enroll from '../../../components/Course/Enroll'

import { Primary } from '../../../components/Button'
import { useCourseData, useUserData, useUserInstances } from '../../../src/data'
import { PrismaClient } from '@prisma/client'
import { getTaggedPostContent } from '../../../src/discourse'
import { useStripe } from '@stripe/react-stripe-js'
import { useApi } from '../../../src/apiHelpers'
import { EnrollMsg, EnrollResponse } from '../../api/courses/[action]'
import Loader from '../../../components/Loader'
import { Info } from '../../../components/Form'
import ErrorPage from '../../404'
import { courseDataQuery } from '../../api/get/[...item]'

const COPY = {
    empty: "There are no upcoming cohorts for this course :(",
    header: "Join a Cohort",
    backToCourse: 'back to the course',
    subtitle: "'Pick a cohort with a start date that works for you. Be sure to check the notes underneath for specifc meeting times and any tweaks to the curriculum.'",
    inviteOnly: "This course is invite only right now. Reach out on the forum if you're interested!",
    invited: "You're invited!"
}


type Props = InferGetStaticPropsType<typeof getStaticProps>
const WrappedEnrollCohortPage = (props:Props)=>props.notFound ? h(ErrorPage) : h(EnrollCohort, props)
export default WrappedEnrollCohortPage

const EnrollCohort = (props:Extract<Props, {notFound: false}>) => {
    let router = useRouter()
    let {data:userInstances} = useUserInstances()
    let {data: course} = useCourseData(props.courseId, props.course)
    let invited = !!userInstances?.invited_courses.find(course=>course.id === props.course.id )

    let instances = (props.instances || [])
            .filter(instance=>{
                if(userInstances?.course_instances.find(i=> i.id ===instance.id)) return false
                return true
            })
    return h(TwoColumn, {}, [
        //Page Content
        h(Box, {gap:16}, [
            h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', COPY.backToCourse))]),
            h('h1', COPY.header),
            h('p', COPY.subtitle)
        ]),
        h(Box, {gap: 64}, [
            //Page Header
            //Upcoming Cohort List
            ...(instances.length === 0
                ? [h(Info, COPY.empty)]
                : instances.map(instance => h(Instance, {...instance, invited, invite_only: course?.invite_only})))
        ]),
        //Course Details Panel
        h(Sidebar, [h(Enroll, {course}, [
            !course ? null : h('div.textSecondary', {style:{width:232}}, [
                course.invite_only && !invited ? COPY.inviteOnly : null,
                course.invite_only && invited ? COPY.invited : null
            ])
        ])]),
    ])
}

let Instance = (props: {
    details: string,
    people: {username: string, display_name: string | null},
    invited: boolean,
    invite_only?: boolean,
    id: string,
    course: string
    start_date: string
})=>{
    let {data: user} = useUserData()
    let stripe = useStripe()
    let router = useRouter()
    let [status, callEnroll] = useApi<EnrollMsg, EnrollResponse>([stripe], (res)=>{
        if(res.zeroCost) router.push('/courses/[id]/[instanceID]', `/courses/${props.course}/${props.id}?welcome`)
        stripe?.redirectToCheckout({sessionId: res.sessionId})
    })

    let onClick= async (e:React.MouseEvent)=> {
        e.preventDefault()
        if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
        if(!props.id) return
        if(!stripe) return
        await callEnroll('/api/courses/enroll', {instanceID: props.id})
    }

    return h(Box, {gap:32},[
        //Individual cohort details
        h (Box, {gap:16}, [
            h(Box, {gap: 8}, [
                h('h3', prettyDate(props.start_date)),
                h('small', [
                    //TODO make the Jared href to the facilitator profile page
                    'Facilitated by ',
                    h(Link, {
                        href:'/people/[username]',
                        as:`/people/${props.people.username}`
                    }, h('a.notBlue', {style: {textDecoration: 'underline'}},
                         props.people.display_name || props.people.username)),
                ])
            ]),
            h('p', props.details),
        ]),
        h(Box, {gap:8, style: {justifyContent: 'right', textAlign: 'right'}}, [
            //TODO Route this to a stripe payment flow
            h(Primary, {onClick, disabled: props.invite_only && !props.invited}, status === 'loading' ? h(Loader) : ' Join this Cohort'),
            h('small', [
                //TODO make this href go to the cohort page
                h(Link, {href: '/courses/[id]/[instanceID]', as: `/courses/${props.course}/${props.id}`}, h('a.notBlue', {style: {textDecoration: 'underline'}}, 'See more details'))
            ]),
        ]),
        h(Seperator),
    ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

export const getStaticProps = async (ctx: any) =>{
    let courseId = (ctx.params?.id || '' )as string
    let prisma = new PrismaClient()

    let course = await courseDataQuery(courseId)
    if(!course) return {props: {notFound: true}} as const

    let instances = await prisma.course_instances.findMany({
        where: {course: courseId},
        include: {
            people: {
                select: {
                    display_name: true,
                    username: true
                }
            }
        }
    })


    let instancesWithContent = await Promise.all(instances.map(async instance => {
        let details = await getTaggedPostContent(courseId + '/' + instance.id, 'note')
        return {...instance, details}
    }))

    return {props:{instances:instancesWithContent, notFound: false, course, courseId}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
