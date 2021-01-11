import h from 'react-hyperscript'
import { InferGetStaticPropsType } from "next"
import { getPublicEventsQuery } from "pages/api/events"
import Link from 'next/link'
import { Box, Seperator } from 'components/Layout'
import Card, { FlexGrid } from 'components/Card'
import styled from '@emotion/styled'
import { prettyDate } from 'src/utils'
import { colors } from 'components/Tokens'

type Props = InferGetStaticPropsType<typeof getStaticProps>
export default function Events(props:Props) {
  let [pastEvents, upcomingEvents] = props.events.reduce((acc, event)=>{
    if(new Date(event.events.start_date) < new Date()) acc[0].push(event)
    else acc[1].push(event)
    return acc
  }, [[],[]] as Array<typeof props.events>)

  return h(Box, {gap:64}, [
    h('h1', "Upcoming Events"),
    h(FlexGrid, {min: 400, mobileMin: 300}, upcomingEvents.map(ev => h(Link, {passHref:true, href:`/events/${ev.event}`}, h(EventCard, [
      h(EventCardHeader),
      h(Box, {padding:16, style:{border: '1px solid', borderTop: 'none', borderRadius: '2px'}}, [
        h(Box, {gap:8},[
          h('h3', ev.events.name),
          h('span',  `${prettyDate(ev.events.start_date)} @ ${(new Date(ev.events.start_date)).toLocaleTimeString([], {hour12: true, minute: '2-digit', hour:'numeric', timeZoneName: "short"})}`),
        ]),
        h(Box, {gap:8},[
          h(Seperator),
          h('span.textSecondary', `${ev.cost === 0 ? "FREE" : '$'+ev.cost}`)
        ])
      ])
    ])))),
    h(Box, {gap:32}, [
      h('h2', "Past Events"),
      h(FlexGrid, {min: 400, mobileMin: 300}, pastEvents.map(ev => h(Link, {passHref:true, href:`/events/${ev.event}`}, h(EventCard, [
        h(EventCardHeader),
        h(Box, {padding:16, style:{border: '1px solid', borderTop: 'none', borderRadius: '2px'}}, [
          h(Box, {gap:8},[
            h('h3', ev.events.name),
            h('span',  `${prettyDate(ev.events.start_date)} @ ${(new Date(ev.events.start_date)).toLocaleTimeString([], {hour12: true, minute: '2-digit', hour:'numeric', timeZoneName: "short"})}`),
          ]),
        ])
      ]))))
    ])
  ])
}

let EventCardHeader = styled('div')`
background-color: ${colors.accentLightBlue};
height:8px;
border: 1px solid;
border-radius: 2px 2px 0px 0px;
`

let EventCard = styled(Card)`
border: none;
padding: 0px;
`

export const getStaticProps = async () => {
  let events = await getPublicEventsQuery()
  return {props: {events}, revalidate: 1} as const
}
