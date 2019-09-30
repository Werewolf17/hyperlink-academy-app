import h from 'react-hyperscript'
import styled from 'styled-components'
import {useState } from 'react'

import {Input, FormContainer, Button, DateInput} from './Styles'
import Loader from '../Loader'

import {FacillitateAPI} from '../../pages/api/facillitate'

type State= 'normal' | 'loading' | 'success' | 'error'
export default () => {
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [webpage, setWebpage] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const [state, setState] = useState<State>('normal')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let data = {description, name, webpage, start, end}
    setState('loading')
    console.log(data)
    let response = await FacillitateAPI(data)
    if(response.status === 200) setState('success')
    else setState('error')
  }

  switch(state) {
    case ('normal'):
      return h(FormContainer, {onSubmit}, [
        h(Input, {
          placeholder: 'course name',
          spellCheck: false,
          onChange: (e) => {
            e.preventDefault()
            setName(e.currentTarget.value)
          }
        }),
        h(Input, {
          placeholder: 'course homepage',
          type: 'url',
          spellCheck: false,
          onChange: (e) => {
            e.preventDefault()
            setWebpage(e.currentTarget.value)
          }
        }),
        h(TextArea, {
          maxLength: 500,
          placeholder: 'course description',
          spellCheck: false,
          onChange: (e:React.FormEvent<HTMLTextAreaElement>) => {
            e.preventDefault()
            setDescription(e.currentTarget.value)
          }
        }),
        h(CharCount, `${description.length}/500`),
        h(DatesInput, [
          h('label', [
            'Start: ', h(DateInput, {
              type:'date',
              onChange: (e) => {
                setStart(e.currentTarget.value)
              }
            }),
          ]),
          h('label', [
            'End: ', h(DateInput, {
              type: 'date',
              onChange: (e) => {
                setEnd(e.currentTarget.value)
              }
            })
          ])
        ]),
        h(Button, {type: 'submit'}, 'submit')
      ])
    case 'loading':
      return h(FormContainer, {}, h(Loader))
    case 'error':
      return h(FormContainer, 'Oh no! Something went wrong. Please try again in a bit, or email jared(at)awarm.space')
    case 'success':
      return h(FormContainer, 'Great! A real human bean will check over your course and get back to you soon :)')
  }

}

const DatesInput = styled('div')`
display: grid;
grid-gap: 10px;
grid-template-columns: auto auto;
`

const TextArea = styled('textarea')`
border: 2px solid;
border-color: black;
box-sizing: border-box;

width: 100%;
padding: 5px 10px;
resize: none;
height: 7em;
`

const CharCount = styled('div')`
font-size: 0.8em;
color: grey;
text-align: right;
`
