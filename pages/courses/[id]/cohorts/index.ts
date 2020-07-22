import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import {InferGetStaticPropsType} from 'next'
import Link from 'next/link'

import { Box, TwoColumn, Sidebar, Seperator } from '../../../../components/Layout'
import Enroll from '../../../../components/Course/Enroll'

import { Primary } from '../../../../components/Button'
import { useCourseData, useUserData, useUserCohorts } from '../../../../src/data'
import { PrismaClient } from '@prisma/client'
import { getTaggedPost } from '../../../../src/discourse'
import { useStripe } from '@stripe/react-stripe-js'
import { useApi } from '../../../../src/apiHelpers'
import { EnrollResponse } from '../../../api/courses/[id]/cohorts/[cohortId]/enroll'
import Loader from '../../../../components/Loader'
import { Info } from '../../../../components/Form'
import ErrorPage from '../../../404'
import Text from '../../../../components/Text'
import {prettyDate} from '../../../../src/utils'
import { courseDataQuery } from '../../../api/courses/[id]'

const COPY = {
    empty: "There are no upcoming cohorts for this course :(",
    header: "Join a Cohort",
    backToCourse: 'back to the course',
    subtitle: 'Pick a cohort with a start date that works for you. Be sure to check the notes underneath for specific meeting times and any tweaks to the curriculum.',
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
                return true
            })
    return h(TwoColumn, {}, [
        //Page Content
        h(Box, {gap:16}, [
            h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a.notBlue', COPY.backToCourse))]),
            h('h1', COPY.header),

        ]),
        h(Box, {gap: 64}, [
            //Page Header
            //Upcoming Cohort List
            ...(cohorts.length === 0
                ? [h(Info, COPY.empty)]
                : cohorts.map(cohort => h(Cohort, {...cohort, invited, invite_only: course?.invite_only})))
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
    invited: boolean,
    invite_only?: boolean,
    id: string,
    course: string
    start_date: string
})=>{
    let {data: user} = useUserData()
    let stripe = useStripe()
    let router = useRouter()
    let [status, callEnroll] = useApi<null, EnrollResponse>([stripe], async (res) => {
        if(res.zeroCost) await router.push('/courses/[id]/[cohortId]?welcome', `/courses/${props.course}/${props.id}?welcome`)
        else stripe?.redirectToCheckout({sessionId: res.sessionId})
    })

    let onClick= async (e:React.MouseEvent)=> {
        e.preventDefault()
        if(user === false) await router.push('/login?redirect=' + encodeURIComponent(router.asPath))
        if(!props.id) return
        if(!stripe) return
        await callEnroll(`/api/courses/${props.course}/cohorts/${props.id.split('-').slice(-1)}`)
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
            h(Text, {source: props.details.text.slice(0, 400) + (props.details.text.length > 400 ?'...' : '')}),
            h(Link, {href: '/courses/[id]/[cohortId]', as: `/courses/${props.course}/${props.id}`}, h('a', {style: {textDecoration: 'underline'}}, h('b', 'See more details')))
        ]),
        h(Box, {gap:8, style: {justifyContent: 'right', textAlign: 'right'}}, [
            h(Primary, {onClick, disabled: props.invite_only && !props.invited}, status === 'loading' ? h(Loader) : ' Join this Cohort'),
        ]),
        h(Seperator),
    ])
}

export const getStaticProps = async (ctx: any) =>{
    let courseId = (ctx.params?.id || '' )as string
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
            }
        }
    })


    let cohortsWithContent = await Promise.all(cohorts.map(async cohort => {
        let details = await getTaggedPost(courseId + '/' + cohort.id, 'note')
        return {...cohort, details}
    }))

    return {props:{cohorts:cohortsWithContent, notFound: false, course, courseId}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}
