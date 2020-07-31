import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import {InferGetStaticPropsType} from 'next'
import Link from 'next/link'
import { useStripe } from '@stripe/react-stripe-js'
import { PrismaClient } from '@prisma/client'

import { Box, TwoColumn, Sidebar, WhiteContainer } from 'components/Layout'
import Enroll from 'components/Course/Enroll'
import Text from 'components/Text'
import { Primary, BackButton } from 'components/Button'
import { Info } from 'components/Form'
import ErrorPage from 'pages/404'

import { useCourseData, useUserData, useUserCohorts } from 'src/data'
import { getTaggedPost } from 'src/discourse'
import { useApi } from 'src/apiHelpers'
import {prettyDate} from 'src/utils'
import { EnrollResponse } from 'pages/api/cohorts/[cohortId]/enroll'
import { courseDataQuery } from 'pages/api/courses/[id]'

const COPY = {
    empty: "There are no upcoming cohorts for this course :(",
    header: "Join a Cohort",
    subtitle: 'Pick a cohort with a start date that works for you. Be sure to check the meeting times and any tweaks to the curriculum.',
    seeMore: "See more details",
    inviteOnly: h('span.accentRed', "This course is invite only right now. Reach out on the forum if you're interested!"),
    invited: h('span.accentSuccess', "You're invited!"),
}


type Props = InferGetStaticPropsType<typeof getStaticProps>
const WrappedEnrollCohortPage = (props:Props)=>props.notFound ? h(ErrorPage) : h(EnrollCohort, props)
export default WrappedEnrollCohortPage

const EnrollCohort = (props:Extract<Props, {notFound: false}>) => {
    let router = useRouter()
    let {data:userCohorts} = useUserCohorts()
    let {data: course} = useCourseData(props.courseId, props.course)
    let invited = !!userCohorts?.invited_courses.find(course=>course.id === props.course?.id )

    let cohorts = (props.cohorts || [])
            .filter(cohort=>{
                if(cohort.completed) return false
                if(userCohorts?.course_cohorts.find(i=> i.id ===cohort.id)) return false
                if(new Date(cohort.start_date)< new Date()) return false
                if(course?.cohort_max_size === 0 && cohort.people_in_cohorts.length >= course.cohort_max_size) return false
                return true
            })
    return h(TwoColumn, {}, [
        //Page Content
        h(Box, {gap:16}, [
            h(BackButton, {href: "/courses/[slug]/[id]", as: `/courses/${router.query.slug}/${router.query.id}`}, 'Course Details'),
            h('h1', COPY.header),
            h('p.big', COPY.subtitle)

        ]),
        h(Box, {gap: 64}, [
            //Page Header
            //Upcoming Cohort List
            ...(cohorts.length === 0
                ? [h(Info, COPY.empty)]
                : cohorts.map(cohort => h(Cohort, {
                    ...cohort,
                    invited,
                    invite_only: course?.invite_only,
                    cohort_max_size: course?.cohort_max_size || 0,
                    learners: cohort.people_in_cohorts.length
                })))
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

let Cohort = (props: {
    details: {text: string, id: string},
    people: {username: string, display_name: string | null},
    learners: number,
    cohort_max_size: number,
    invited: boolean,
    invite_only?: boolean,
    id: number,
    course: number
    start_date: string
})=>{
    let {data: user} = useUserData()
    let stripe = useStripe()
    let router = useRouter()
    let [status, callEnroll] = useApi<null, EnrollResponse>([stripe], async (res) => {
        if(res.zeroCost) await router.push('/courses/[slug]/[id]/cohorts/[cohortId]?welcome', `/courses/${router.query.slug}/${props.course}/cohorts/${props.id}?welcome`)
        else stripe?.redirectToCheckout({sessionId: res.sessionId})
    })

    let onClick= async (e:React.MouseEvent)=> {
        e.preventDefault()
        if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
        if(!props.id) return
        if(!stripe) return
        await callEnroll(`/api/cohorts/${props.id}/enroll`)
    }

    return h(Box, {gap:32},[
        //Individual cohort details
        h (Box, {gap:16}, [
            h(Box, {gap: 8}, [
                h('h2', prettyDate(props.start_date)),
                h('span', [
                    'Facilitated by ',
                    h(Link, {
                        href:'/people/[username]',
                        as:`/people/${props.people.username}`
                    }, h('a.notBlue', {style: {textDecoration: 'underline'}},
                         props.people.display_name || props.people.username)),
                ])
            ]),
            h(WhiteContainer, [
                h(Text, {source: props.details.text.slice(0, 400) + (props.details.text.length > 400 ?'...' : '')}),
                h(Link, {
                    href: '/courses/[slug]/[id]/cohorts/[cohortId]',
                    as: `/courses/${router.query.slug}/${props.course}/cohorts/${props.id}`
                }, h('a', {style: {textDecoration: 'underline'}}, h('b', 'See more details')))
            ]),
        ]),
        h(Box, {gap:8, h: true, style: {justifyContent: 'right', textAlign: 'right', alignItems: 'center'}}, [
            h(Primary, {onClick, disabled: props.invite_only && !props.invited, status}, 'Join this Cohort'),
            h('span.accentSuccess', `${props.cohort_max_size - props.learners} spots left!`)
        ]),
    ])
}

export const getStaticProps = async (ctx: any) =>{
    let courseId = parseInt(ctx.params?.id as string || '' )
    if(Number.isNaN(courseId)) return {props: {notFound: true}} as const
    let prisma = new PrismaClient()

    let course = await courseDataQuery(courseId)
    if(!course) return {props: {notFound: true}} as const

    let cohorts = await prisma.course_cohorts.findMany({
        where: {AND: [{
            course: courseId,
            live: true
        }]},
        include: {
            people: {
                select: {
                    display_name: true,
                    username: true
                }
            },
            people_in_cohorts: {}
        }
    })


    let cohortsWithContent = await Promise.all(cohorts.map(async cohort => {
        let details = await getTaggedPost(cohort.category_id, 'note')
        return {...cohort, details}
    }))

    return {props:{cohorts:cohortsWithContent, notFound: false, course, courseId}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}

