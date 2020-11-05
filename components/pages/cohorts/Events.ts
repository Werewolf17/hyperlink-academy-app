import h from 'react-hyperscript'
import { getTimeBetween } from 'src/utils'
import { useState, useEffect } from 'react'
import { Box, FormBox } from 'components/Layout'
import styled from '@emotion/styled'
import { colors } from 'components/Tokens'
import {Pencil} from 'components/Icons'
import { EventForm } from './CreateEvent'
import { LinkButton, Primary, IconButton, Destructive } from 'components/Button'
import { useApi } from 'src/apiHelpers'
import { UpdateEventMsg, UpdateEventResult, DeleteEventResult } from 'pages/api/events/[id]'
import Text from 'components/Text'

type Event = {
  id: number
  name: string
  start_date: string,
  end_date: string,
  location: string | null,
  description: string,
}
export const CohortEvents = (props: {facilitating: boolean, cohort: number, events: Array<Event>, mutate: (E:Array<Event>)=>void})=>{
  let pastEvents = props.events.filter((event)=>new Date() > new Date(event.end_date))
  let [showPastEvents, setShowPastEvents] = useState(pastEvents.length === props.events.length)

  let displayedEvents = props.events
        .filter((event)=>showPastEvents ? true : new Date() < new Date(event.end_date) )
        .sort((a, b) => new Date(a.start_date) > new Date(b.start_date) ? 1 : -1)
  return h(Box, [
    pastEvents.length === 0 ? null : h(LinkButton, {textSecondary: true, onClick: ()=>{
      setShowPastEvents(!showPastEvents)
    }}, showPastEvents ? "hide past events" : "show past events"),
    h(TimelineContainer, {},
      displayedEvents
        .map((event,index) => h(Event, {
          key: event.id,
          facilitating: props.facilitating,
          event,
          cohort: props.cohort,
          mutate: (newEvent:Event) => {
            let events = props.events.slice(0)
            events[index] === newEvent
            return props.mutate(events)
          },
          mutateDelete: ()=>{
            let events = props.events.slice(0)
            events.splice(index, 1)
            return props.mutate(events)
          },
          first: showPastEvents ? index === pastEvents.length : index === 0,
          last: index === displayedEvents.length -1,
        }))
     )
  ])

}

const Event = (props: {
  event:Event,
  facilitating: boolean
  cohort: number,
  last: boolean,
  first: boolean,
  mutate: (e:Event)=>void,
  mutateDelete: ()=>void,
})=>{
  let [editting, setEditing] = useState(false)
  let [expanded, setExpanded] = useState(props.first)
  let event = props.event
  let start_date = new Date(event.start_date)
  let end_date = new Date(event.end_date)
  let past = end_date < new Date()

  let [formState, setFormState] = useState({
    name: event.name,
    location: event.location || '',
    description: event.description,
    start_date: `${start_date.getFullYear()}-${start_date.getMonth()}-${start_date.getDate()}`,
    start_time: `${start_date.getHours()}:${start_date.getMinutes()}`,
    end_time: `${end_date.getHours()}:${end_date.getMinutes()}`,
  })

  let[status, callUpdateEvent] = useApi<UpdateEventMsg, UpdateEventResult>([props], async (event)=>{
    props.mutate(event)
    setEditing(false)
  })

  let [deleteStatus, callDeleteEvent] = useApi<null, DeleteEventResult>([], ()=>{
    setEditing(false)
    props.mutateDelete()
  })
  useEffect(()=>setFormState({
    name: event.name,
    location: event.location || '',
    description: event.description,
    start_date: `${start_date.getFullYear()}-${('0'+(start_date.getMonth()+1)).slice(-2)}-${('0'+start_date.getDate()).slice(-2)}`,
    start_time: start_date.toLocaleTimeString([], {hour:"2-digit", minute: "2-digit", hour12: false}),
    end_time: end_date.toLocaleTimeString([], {hour:"2-digit", minute: "2-digit", hour12: false}),
  }),[event])

  const onSubmit = (e: React.FormEvent)=>{
    e.preventDefault()
    let event = formState

    let d1 = event.start_date.split('-').map(x=>parseInt(x))
    let t1 = event.start_time.split(':').map(x=>parseInt(x))
    let t2 = event.end_time.split(':').map(x=>parseInt(x))
    let start_date = new Date(d1[0], d1[1] -1, d1[2], t1[0], t1[1])
    let end_date = new Date(d1[0], d1[1] - 1, d1[2], t2[0], t2[1])

    callUpdateEvent('/api/events/'+props.event.id, {
      id: props.event.id,
      cohort: props.cohort,
      data: {
        name: event.name,
        description: event.description,
        location: event.location,
        start_date: start_date.toISOString(),
        end_date: end_date.toISOString()
      }
    })
  }

  return h(EventContainer, {last: props.last, selected: expanded}, [
    h(Dot, {selected: expanded, onClick: ()=>setExpanded(event.description === '' ? false : !expanded), past}),
    editting ? h(FormBox, {onSubmit}, [
      h(EventForm, {onChange: setFormState, state:formState}),
      h(Box, {h: true, style:{justifySelf: "right", alignItems: "center"}}, [
        h(LinkButton, {textSecondary: true, onClick: ()=>setEditing(false)}, "cancel"),
        h(Destructive, {status: deleteStatus, onClick: (e)=>{
          e.preventDefault()
          callDeleteEvent('/api/events/'+props.event.id, null, "DELETE")
        }}, "Delete Event"),
        h(Primary, {type: 'submit', status}, "Save Changes")
      ])
    ]): h(Box, {}, [
      h(Box, [
        h(Box, {gap: 8}, [
          h('p.textSecondary', {style: {color: past ? colors.grey55 : undefined}}, [
          h('b', {style:{fontWeight:"900"}}, start_date.toLocaleDateString([], {weekday: 'short', month: "short", day: "numeric"}).toUpperCase()),
          ' ' + start_date.toLocaleTimeString([], {hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: 'short'}) +
          ` | ` + getTimeBetween(start_date, end_date) + ' hrs',
        ]
         ),
          h(Box, {h: true, style:{gridTemplateColumns:"auto min-content"}}, [
            h(EventTitle, {past, onClick: ()=>setExpanded(!expanded)}, event.name),
            props.facilitating ? h(IconButton, {
              style: {alignSelf: 'baseline'},
              onClick: ()=>setEditing(true)
            }, Pencil) : null
          ]),
        ]),
        event.location && expanded ? h('a', {href: event.location}, h(Primary,  "Join Event")) : null,
      ]),
      !expanded || event.description === '' ? null
        : h('div', {style: {padding: '32px', backgroundColor: 'white', border: 'dotted 1px'}}, h(Text, {source: event.description}))
    ])
  ])
}

const Dot = styled('div')<{selected: boolean, past: boolean}>`
${p => {
let size = p.selected ? 24 : 16
return `
width: ${size}px;
height: ${size}px;
margin-right: ${p.selected ? 32 : 34}px;
`}}
box-sizing: border-box;
border: 4px solid;
background-color: white;
border-radius: 50%;

${p=>p.past ? `background-color: ${colors.grey80};` : ''}

&:hover {
cursor: pointer;
}
`

const EventTitle = styled('h3')<{past: boolean}>`
${p=>p.past ? `color: ${colors.textSecondary};` : ''}
&:hover {
cursor: pointer;
}
`
const TimelineContainer = styled('div')`
display: grid;
grid-gap: 32px;
border-left: 4px solid;
padding-left: 32px;
`

const EventContainer = styled('div')<{last?: boolean, selected: boolean}>`
box-sizing: border-box;
margin-left: -${p=>p.selected ? 46 : 42}px;
display: grid;
grid-template-columns: min-content auto;
max-width: 1024px;
${p=>p.last ? `background-color: ${colors.appBackground};` : ''}
`
