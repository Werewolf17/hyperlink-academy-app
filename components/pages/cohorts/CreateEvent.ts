import h from 'react-hyperscript'
import { Secondary, Primary } from 'components/Button'
import { FormBox, LabelBox, Box } from 'components/Layout'
import { colors } from 'components/Tokens'
import { useState } from 'react'
import { Input, Textarea } from 'components/Form'
import { useApi } from 'src/apiHelpers'
import { CreateEventMsg, CreateEventResponse } from 'pages/api/events'
import { events } from '@prisma/client'

type Event = {
  name: string,
  start_date: string,
  start_time: string,
  end_time: string,
  location: string,
  description: string
}

export const CreateEvent = (props: {cohort:number, mutate: (e:{events:events})=>void}) => {
  let [open, setOpen] = useState(false)
  let [event, setEvent] = useState({
    name: '',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: ''
  })
  let [status, callCreateEvent] = useApi<CreateEventMsg, CreateEventResponse>([event], (e)=>{
    props.mutate(e)
    setEvent({
      name: '',
      start_date: '',
      start_time: '',
      end_time: '',
      location: '',
      description: ''
    })
    setOpen(false)
  })

  let onSubmit = (e: React.FormEvent) =>{
    e.preventDefault()

    let start_date = new Date(event.start_date+' '+event.start_time)
    let end_date = new Date(event.start_date+' '+event.end_time)

    callCreateEvent('/api/events', {
      cohort: props.cohort,
      name: event.name,
      description: event.description,
      location: event.location,
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString()
    })
  }
  return h(Box, [
    h(Secondary, {disabled: open, onClick: () => setOpen(true)}, '+ Add New Event'),
    !open ? null
      : h(FormBox, {onSubmit}, [
        h(EventForm, {state: event, onChange: setEvent}),
        h(Box, {h: true, style:{justifySelf: "right"}}, [
          h(Secondary, {onClick: ()=>setOpen(!open)}, "Cancel"),
          h(Primary, {type: 'submit', status}, "Create Event")
        ])
      ])
  ])
}

export const EventForm = (props:{onChange: (e: Event)=>void, state: Event}) => {
  return h(Box, {width: 640, padding: 32, gap: 32, style: {backgroundColor: colors.grey95}}, [
      h(LabelBox, {gap:8}, [
        h('h4', "Event Name"),
        h(Input, {
          type: 'text',
          required: true,
          onChange: e=>props.onChange({...props.state, name: e.currentTarget.value}),
          value: props.state.name
        })
      ]),
      h(Box, {h: true, gap: 32, style:{gridAutoColumns: 'auto'}}, [
        h(LabelBox, {gap:8}, [
          h('h4', 'Date'),
          h(Input, {
            type: 'date',
            required: true,
            value: props.state.start_date,
            onChange: e => props.onChange({...props.state, start_date: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8}, [
          h('h4', 'Start Time'),
          h(Input, {
            type: 'time',
            required: true,
            value: props.state.start_time,
            onChange: e => props.onChange({...props.state, start_time: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8}, [
          h('h4', 'End Time'),
          h(Input, {
            type: "time",
            required: true,
            value: props.state.end_time,
            onChange: e => props.onChange({...props.state, end_time: e.currentTarget.value})
          })
        ]),
      ]),
      h(LabelBox, {gap:8}, [
        h('div', [
          h('h4', "Location"),
          h('small.textSecondary', "A link to where the conversation will happen (like zoom)")
        ]),
        h(Input, {
          type: 'text',
            required: true,
          value: props.state.location,
          onChange: e => props.onChange({...props.state, location: e.currentTarget.value})
        })
      ]),
      h(LabelBox, {gap: 8}, [
        h('h4', "Description"),
        h(Textarea, {
          value: props.state.description,
          onChange: e => props.onChange({...props.state, description: e.currentTarget.value})
        })
      ]),
    ])
}
