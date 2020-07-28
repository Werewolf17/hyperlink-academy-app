import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getTemplatesQuery } from 'pages/api/courses/[id]/templates'
import { InferGetStaticPropsType } from 'next'
import { Box, Seperator, FormBox, LabelBox } from 'components/Layout'
import { Secondary, Primary } from 'components/Button'
import { useState, Fragment } from 'react'
import { Input } from 'components/Form'
import EditorWithPreview from 'components/EditorWithPreview'
import Loader, { PageLoader } from 'components/Loader'
import { useApi } from 'src/apiHelpers'
import { PostTopicMsg, PostTopicResponse } from 'pages/api/courses/[id]/cohorts/[cohortId]/postTopic'
import { Modal } from 'components/Modal'

export default CohortTemplatesPages
type Props = InferGetStaticPropsType<typeof getStaticProps>
function CohortTemplatesPages(props:Props) {
  let router = useRouter()
  let template = props.templates?.find(t=> t.name === router.query.template)
  if(!props.templates) return h(PageLoader)

  if(template) return h(Box, {gap: 64}, [
    h(Box, {gap:16}, [
      h('div.textSecondary', ['<< ' , h(Link, {
        href: "",
        shallow: true}, h('a.notBlue', 'back to templates'))]),
      h('h1', "Post template")
    ]),
    h(TemplatePage, {template})
  ])

  return h(Box, {width: 640, gap: 64},[
    h(Box, {gap:16}, [
      h('div.textSecondary', ['<< ' , h(Link, {
        href: "/courses/[id]/cohorts/[cohortId]",
        as: `/courses/${router.query.id}/cohorts/${router.query.cohortId}`}, h('a.notBlue', 'back to cohort page'))]),
      h('h1', "Templates"),
      h('p', [
        `Use templates to easily post new topcs in your cohort forum!
You can create new templates in the `,
        h(Link, {href: '/courses/[id]/settings', as:`/courses/${router.query.id}/settings`}, h('a', 'course settings'))
      ])
    ]),
    h(Box, {}, props.templates
      ?.filter(t=>t.type === 'triggered')
      .sort((a, b)=>  a.name > b.name ? 1 : -1)
      .flatMap(template => {
        return [
          h(Box, {h: true, style: {gridAutoColumns: 'auto'}},[
            h('div', [
              h('h3', template.name),
              h('span.textSecondary', template.type ==='prepopulated' ? "Prepopulated for all cohorts" : "Manually published by facilitator")
            ]),
            h(Box, {h: true, style:{justifySelf: 'end', alignItems: 'center'}}, [
              h(Link, {
                href: '?template='+template.name,
                shallow: true,
              }, h(Secondary, 'Use'))
            ])
          ]),
          h(Seperator)
        ]}).slice(0, -1))
  ])
}

function TemplatePage(props: {template: Props['templates'][0]}) {
  let [formState, setFormState] = useState(props.template)
  let [post, setPost] = useState<number | undefined>()
  let [status, callPost] = useApi<PostTopicMsg, PostTopicResponse>([])
  let router = useRouter()

  let onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()
    let res = await callPost(`/api/courses/${router.query.id}/cohorts/${router.query.cohortId}/postTopic`, {title: formState.title, body: formState.content, tags:[]})
    console.log(res)
    if(res.status===200) setPost(res.result.topic.topic_id)
  }

  let changed = props.template.title !== formState.title ||
    props.template.content !== formState.content

  return h(Fragment, [
    post && status === 'success' ? h(Modal, {display: !!post, onExit: ()=>{setPost(undefined)}}, h(Box, {gap:32},[
      h(Box, {gap:16, style:{textAlign: 'center'}}, [
      h('h1', "Cool!"),
        h('p', "Your topic has been added")
      ]),
      h(Box, [
        h('a', {href: 'https://forum.hyperlink.academy/t/'+post}, h(Primary, {style:{width:'100%'}}, "View it here")),
      h(Link, {
        href: '/courses/[id]/cohorts/[cohortId]/templates',
        as: `/courses/${router.query.id}/cohorts/${router.query.cohortId}/templates`
      }, h('a', {}, h(Secondary, {style:{width:'100%'}}, 'Back to Templates')))
      ])
    ])) : null,
    h(FormBox, {onSubmit, gap:32}, [
      h(LabelBox, {width: 400}, [
        h('h4', "Title"),
        h(Input, {
          type: 'text',
          name: 'title',
          value: formState.title,
          onChange:e=>setFormState({...formState, title: e.currentTarget.value})
        })
      ]),
      h(LabelBox, [
        h('h4', "Body"),
        h(EditorWithPreview, {value: formState.content, onChange: e=> setFormState({...formState, content: e.currentTarget.value})})
      ]),
      h(Box, {h:true, style:{justifySelf: 'right'}}, [
        h(Secondary, {disabled: !changed, onClick:()=>setFormState(props.template)}, "Reset Template"),
        h(Primary, {type: 'submit'}, status === 'loading' ? h(Loader) : "Post to the forum"),
      ])
    ])
  ])
}

export const getStaticProps = async (ctx:any)=>{
  let cohortNum = (ctx.params?.cohortId || '' )as string
  let courseId = (ctx.params?.id || '' )as string
  let templates = await getTemplatesQuery(courseId)
  return {props: {templates, courseId, cohortNum}}
}

export const getStaticPaths = async ()=>{
  return {paths:[], fallback: true}
}
