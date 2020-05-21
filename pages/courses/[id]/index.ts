import h from 'react-hyperscript'
import styled from '@emotion/styled'
import Markdown from 'react-markdown'

import Link from 'next/link'

import { Category } from '../../../src/discourse'
import { Box, MediumWidth, Seperator } from '../../../components/Layout'

import {Input, Label, Error, Info, Select} from '../../../components/Form'
import {Primary} from '../../../components/Button'
import { useUserData, useUserInstances, useCourseData } from '../../../src/data'
import { courseDataQuery } from '../../api/get/[...item]'
import { useState, useEffect } from 'react'
import { colors } from '../../../components/Tokens'
import { useRouter } from 'next/router'
import {CreateInstanceMsg, CreateInstanceResponse} from '../../api/courses/[action]'
import { callApi } from '../../../src/apiHelpers'
import Loader from '../../../components/Loader'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type Props = PromiseReturn<ReturnType<typeof getStaticProps>>['props']
const CoursePage = (props:Props) => {
  let {data: user} = useUserData()
  let {data: course} = useCourseData(props.id, props.course || undefined)
  let {data: userInstances} = useUserInstances()

  let isMaintainer = !!(course?.course_maintainers.find(maintainer => user && maintainer.maintainer === user.id))
  return h(Layout, [
    h(Side, [
      h(CourseInfo, [
        h(Cost, '$'+course?.cost),
        h(Box, {gap: 8, style: {color: colors.textSecondary}}, [
          h('b', course?.duration),
          h('b', 'Prerequisites'),
          h('p', course?.prerequisites)
        ]),
        h(Seperator),
        h('div', [
          h('h3', 'Enroll in an Instance'),
          h('div', {style: {color: colors.textSecondary, fontSize: '0.8rem', fontWeight: 'bold'}},
            'Click on an instance below for details'),
          h('ul', course?.course_instances
            .filter(i => !userInstances?.course_instances.find(x => x.id === i.id))
            .map(instance => h('li', [
              h(Link, {href: "/courses/[id]/[instanceID]", as:`/courses/${props.id}/${instance.id}`},
                h('a', instance.id))
            ])))
        ])
      ])
    ]),
    h(Content, [
      h(Box, {gap: 32}, [
        h(Box, {gap: 16}, [
          h(Title, [
            h('h1', course?.name),
          ]),
          h('span', {style:{color: 'blue'}}, [h('a',{href:`https://forum.hyperlink.academy/c/${course?.id}`},  'Check out the course forum '), '➭'])
        ]),
        course?.description || ''
      ]),
      h(Details, {isMaintainer, content: props.content, instances: course?.course_instances})
    ])
  ])
}

export default CoursePage

type DetailsProps = {
  content: string
  isMaintainer: boolean
  instances: Exclude<Props['course'], null>['course_instances'] | undefined
}
const Details = (props:DetailsProps) => {
  let [nav, setNav] = useState<'curriculum' | 'instances' | 'settings'>('curriculum')

  let views = {
    curriculum:  h(Text, {}, h(Markdown, {source: props.content})),
    instances: h(Instances, {instances: props.instances}),
    settings: h(Settings)
  }


  return h(Box, {gap: 32}, [
    h(Nav, [
      h(Tab, {active: nav === 'curriculum', onClick: ()=> setNav('curriculum')}, "Curriculum"),
      h(Tab, {active: nav === 'instances', onClick: ()=> setNav('instances')}, "Instances"),
      !props.isMaintainer ? null : h(Tab, {active: nav === 'settings', onClick: ()=> setNav('settings')}, "Settings"),
    ]),
    views[nav]
  ])
}

const Instances = (props: Pick<DetailsProps, 'instances'>) => {
  let {data: userInstances} = useUserInstances()
  let {data: user} = useUserData()

  return h(Box, {gap:32}, [
    h('h2', "Instances"),
    h(Box, {gap: 32},
      props.instances?.flatMap(instance=>{
        let inInstance = userInstances?.course_instances.find(x=> x.id===instance.id)
        let isFacillitator = user && instance.facillitator === user.id
        return [
          h(Box, {gap: 16}, [
            h('div', [
              inInstance ? h(Pill, 'enrolled') : null,
              ' ',
              isFacillitator ? h(Pill, {borderOnly: true}, 'facillitating') : null,
            ]),
            h('h3', {}, h(Link, {
              href:'/courses/[id]/[instanceID]',
              as:  `/courses/${instance.course}/${instance.id}`
            }, h('a', instance.id))),
            h(Box, {style: {color: colors.textSecondary}, gap: 4}, [
              h('strong', `${prettyDate(instance.start_date)} - ${prettyDate(instance.end_date)}`),
              h('div', `Facillitated by ${instance.people.display_name}`)
            ])
          ]),
          h(Seperator)
        ]
      }))])
}

const Settings = () => {
  return h(Box, {gap: 64}, [
    h(Box, {style: {width:400}}, [
      h('div', [
        `To add a new maintainer or remove an instance please email `,
        h('a',{href:'mailto:contact@hyperlink.academy'}, 'contact@hyperlink.academy'),
      ]),
      h(Seperator),
    ]),
    h(AddInstance),
  ])
}

const AddInstance = ()=>{
  let [newInstance, setNewInstance] = useState({start: '', end: '', facillitator: ''})
  let [formState, setFormState] = useState<'normal' | 'error' |'success' | 'loading'>('normal')
  let router = useRouter()
  let {data:courseData, mutate} = useCourseData(router.query.id as string)
  useEffect(()=>setFormState('normal'), [newInstance])

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(!courseData) return
    setFormState('loading')
    let res = await callApi<CreateInstanceMsg, CreateInstanceResponse>('/api/courses/createInstance', {courseId: courseData.id, ...newInstance})
    if(res.status === 200) {
      mutate({
        ...courseData,
        course_instances: [...courseData.course_instances, res.result]
      })
      setFormState('success')
    }
    else setFormState('error')
  }

  return h('form', {onSubmit}, [
    h(Box, {gap: 32, style: {width: 400}}, [
      h('h2', 'Add a new Instance'),
      formState === 'error' ? h(Error, 'An error occured') : null,
      formState === 'success' ? h(Info, 'Instance created!') : null,
      h(Label, [
        h(Select, {
          required: true,
          onChange: (e:React.ChangeEvent<HTMLSelectElement>)=> setNewInstance({...newInstance, facillitator: e.currentTarget.value})
        }, courseData?.course_maintainers.map(maintainer => {
          return h('option', {value: maintainer.maintainer}, maintainer.people.display_name)
        })),
      ]),
      h(Label, [
        'Start Date',
        h(Input, {
          type: 'date',
          required: true,
          value: newInstance.start,
          onChange: e => setNewInstance({...newInstance, start: e.currentTarget.value})
        })
      ]),
      h(Primary, {type: 'submit'}, formState === 'loading' ? h(Loader) : 'Add a new Instance'),
      h(Seperator),
    ])
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})

const Cost = styled('div')`
font-size: 64px;
font-weight: bold;
`

const Pill = styled('span')<{borderOnly?: boolean}>`
width: fit-content;
padding: 2px 8px;
font-size: 0.75rem;
border-radius: 4px;
color: ${colors.textSecondary};
${props=> props.borderOnly
? `border: 1px solid ${colors.grey35};
border-radius: 2px;
`
: `background-color: ${colors.grey90};`
}
`

const Nav = styled('div')`
display: grid;
grid-gap: 32px;
grid-template-columns: repeat(3, min-content);
border-bottom: 3px solid;
`

const Tab = styled('h4')<{active:boolean}>`
padding-bottom: 4px;
margin-bottom: 2px;

&:hover {
cursor: pointer;
}

${props => props.active ? 'color: blue' : ''};
${props => props.active ? 'border-bottom: 4px solid' : ''};
`.withComponent('a')

const Title = styled('div')`
display: grid;
grid-template-columns: auto auto;
align-items: center;
`

const Side = styled('div')`
grid-column: 2;
grid-row: 1;
@media(max-width: 1016px) {
grid-column: 1;
}
`

const Content  = styled(MediumWidth)`
margin: 0;
grid-column: 1;
grid-row: 1;
grid-column: 1;

display: grid;
grid-gap: 64px;
grid-auto-rows: min-content;


@media(max-width: 1016px) {
grid-row: 2;
}
`

const Text = styled('div')`
h1 {
margin-bottom: 8px;
margin-top: 16px;
}

p {
margin-bottom: 16px;
}

li {
margin-bottom: 8px;
margin-top: 8px;
}
`

const Layout = styled('div')`
display: grid;
grid-template-columns: auto max-content;
grid-gap: 16px;

@media(max-width: 1016px) {
grid-template-columns: auto;
grid-template-rows: auto auto;
}
`

const CourseInfo = styled('div')`
width: 240px;
position: sticky;
top: 32px;

display: grid;
grid-gap: 16px;
grid-auto-rows: min-content;
`

export const getStaticProps = async (ctx:any) => {
  let id = (ctx.params?.id || '' )as string

  let content = await getCourseContent(id)
  let data = await courseDataQuery(id)

  return {props: {content, id, course: data}, unstable_revalidate: 1} as const
}

export const getStaticPaths = () => {
  return {paths:[], fallback: true}
}

const getCourseContent = async (id:string) => {
  let res = await fetch(`https://forum.hyperlink.academy/c/${id}.json`)
  let category = await res.json() as Category
  let topicID = category.topic_list.topics.find((topic) => topic.pinned === true)?.id
  let topicRequest = await fetch('https://forum.hyperlink.academy/raw/' + topicID)
  return await topicRequest.text()
}
