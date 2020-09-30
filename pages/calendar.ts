import h from 'react-hyperscript'
import { Box, Seperator } from "components/Layout"
import { useRef } from "react"
import { Input } from 'components/Form'
import { Primary } from 'components/Button'
import { useUserData, useProfileData } from 'src/data'

export default function Calender(){
  let ref = useRef<HTMLInputElement | null>(null)
  let {data: user} = useUserData()
  let {data:profile} = useProfileData(user ? user.username : undefined)

  if(!user || !profile) return null

  return h(Box, {gap:32, width: 640, ma: true}, [
    h('h2', "Add to Calendar"),
    h(Box, [
      h('b', `Add course events to your calendar by subscribing to this url.`),
      h('small.textSecondary',`❗ You only need to do this once! We will automatically sync changes and add events from anything you take in the future.`)
    ]),
    h(Box, {style:{justifyItems: 'center'}}, [
      h(Input, {
        ref,
        onFocus: e =>{
          e.currentTarget.selectionEnd = e.currentTarget.value.length
        },
        value: window.location.origin+ "/api/user_calendar?id="+(profile.calendar_id),
        style: {minWidth: '300px'},
        readOnly: true,
      }),
      h(Primary, {
        onClick: e =>{
          e.preventDefault()
          if(!ref.current) return
          ref.current.select()
          document.execCommand('copy')
          ref.current.selectionEnd  = ref.current.selectionStart
          ref.current.blur()
        }
      }, 'Copy URL' ),
    ]),
    h(Seperator),
    h(Box, [
      h('h3', "How to Subscribe"),
      h('div', {style:{textAlign: "left"}}, [
        h('h4', "Google Calendar"),
        h('p', [
          h('a', {href:"https://calendar.google.com/calendar/u/0/r/settings/addcalendar"}, "Click here"),
          ` and past in the URL above.`
        ])

      ]),
      h('div', {style:{textAlign: "left"}}, [
        h('h4', "Apple Calendar"),
        h('p', `Hit ‘⌥ + ⌘ + S’ and paste in the URL above.`)
      ]),
      h('div', {style:{textAlign: "left"}}, [
        h('h4', "Outlook"),
        h('ol', {style: {marginTop: '0'}}, [
          h('li', `Click the calendar icon at the bottom on the page`),
          h('li', `Click “Add Calendar” `),
          h('li', `Click “Subscribe from Web” and paste in the URL above`)
        ])
      ])
    ])
  ])
}
