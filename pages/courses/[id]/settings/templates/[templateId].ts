import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useApiData, callApi } from 'src/apiHelpers'
import { GetTemplatesResult } from 'pages/api/courses/[id]/templates'
import Loader, { PageLoader } from 'components/Loader'
import { useState, useEffect } from 'react'
import { course_templates } from '@prisma/client'
import { Box, LabelBox, FormBox } from 'components/Layout'
import { Input, Radio } from 'components/Form'
import { Primary, Secondary } from 'components/Button'
import {CreateTemplateMsg, CreateTemplateResult} from 'pages/api/courses/[id]/templates'
import { UpdateTemplateMsg, UpdateTemplateResult } from 'pages/api/courses/[id]/templates/[templateId]'
import EditorWithPreview from 'components/EditorWithPreview'

function TemplateSettings() {
  let router = useRouter()
  let templateId = router.query.templateId
  let courseId = router.query.id
  let {data: templates, mutate }= useApiData<GetTemplatesResult>(courseId ? `/api/courses/${router.query.id}/templates` : undefined)
  let template = templates ? templates.find(t=> t.name === templateId) : undefined

  let [formState, setFormState] = useState<Omit<course_templates, 'course' | 'required'>>(template || {name: '', content:'', type: 'prepopulated', title: ''})
  let [status, setStatus] = useState<'loading' | 'normal' |'success'>('normal')

  useEffect(()=>{
    if(template) setFormState(template)
  }, [template])

  if(templateId !=='new' && templates === undefined) return h(PageLoader)

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    let res:CreateTemplateResult | UpdateTemplateResult
    setStatus('loading')
    if(templateId === 'new') {
      res = await callApi<CreateTemplateMsg, CreateTemplateResult>(`/api/courses/${courseId}/templates`, formState)
      if(res.status === 200 && templates) {
        templates.push(res.result)
        mutate(templates)
      }
    } else {
      res = await callApi<UpdateTemplateMsg, UpdateTemplateResult>(`/api/courses/${courseId}/templates/${templateId}`, formState)
      if(res.status === 200 && templates) mutate(templates?.map(t=>{
          if(res.status === 200 && template && t.name===template.name) return res.result
          return t
        }))
    }
    if(res.status === 200) {
      setStatus('success')
      if(templateId === 'new') router.push(`/courses/[id]/settings/templates/[templateId]`,
                                           `/courses/${courseId}/settings/templates/${res.result.name}`)
    }
  }

  let disabled = templateId !== 'new' && template &&
    !(formState.name !== template.name ||
      formState.title !== template.title ||
      formState.content !== template.content ||
      formState.type !== template.type)

  return h(Box, {gap: 64}, [
    h(Box, {width: 640}, [
      h('div.textSecondary', ['<< ' , h(Link, {href: "/courses/[id]/settings", as: `/courses/${router.query.id}/settings`}, h('a.notBlue', 'Back to settings'))]),
      h('h2', router.query.templateId === 'new' ? 'Add a New Template' : "Edit this Template"),
      h('p', `You can create templates to be included in every cohort's forum, or to be
triggered by a facilitator at any time`)
    ]),
    h(FormBox, {onSubmit, gap: 32}, [
      h(LabelBox, {width: 400}, [
        h('h4', "Template Name"),
        h(Input, {
          disabled: template?.required || undefined,
          type: "text",
          value: formState.name,
          onChange: e => setFormState({...formState, name: e.currentTarget.value})
        })
      ]),
      h(LabelBox, {width: 640}, [
        h('h4', "Type"),
        h(Radio, {
          disabled: template?.required || undefined,
          name: "type",
          selected: formState.type,
          onChange: (v)=>{
            setFormState({...formState, type:v as typeof formState.type})
          },
          items: [
            {value: "prepopulated", component: h('div', [
              h('h4', 'Prepopulated'),
              h('span.textSecondary', "This topic will automatically be posted when each new cohort is created")
            ])},
            {value:"triggered", component: h('div', [
              h('h4', "Triggered"),
              h('span.textSecondary', "This topic will be posted when the facilitator triggers it from the cohort settings page")
            ])}
          ] as const
        })
      ]),
      h(LabelBox, {width: 400}, [
        h('h4', "Template Title"),
        h('p.textSecondary', "Default title of the published template. You'll be able to edit this when publishing to a cohort"),
        h(Input, {
          type: "text",
          value: formState.title,
          onChange: e => setFormState({...formState, title: e.currentTarget.value})
        })
      ]),
      h(LabelBox, [
        h('div', [
          h('h4', "Template Body"),
          h(Box, {width: 400}, [
            h('p.textSecondary', "This is the default body text of the published topic. You'll be able to edit it when publishing to a cohort."),
            h('p.textSecondary', ["You can use Markdown to format ", h('a', {href: 'https://commonmark.org/help/'}, "(here's a quick reference)")]),
          ]),
        ]),
        h(EditorWithPreview, {
          value: formState.content,
          onChange: e=>setFormState({...formState, content: e.currentTarget.value})
        }),
      ]),
      h(Box, {h: true, gap: 8, style:{justifySelf: 'end'}}, [
        h(Secondary, {
          disabled,
          onClick: (e) => {
            e.preventDefault()
            if(template) setFormState(template)
          }
        }, "Discard changes"),
        h(Primary, {
          type: 'submit',
          disabled
        }, status === 'loading'
          ? h(Loader)
          : templateId === 'new' ? 'Create New Template' : "Update Template")
      ])
    ])
  ])
}

export default TemplateSettings
