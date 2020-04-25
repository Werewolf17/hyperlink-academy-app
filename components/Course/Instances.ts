import h from 'react-hyperscript'
import {CourseData} from '../../pages/courses/[id]'
import {useUserInstances} from '../../src/user'
import { Box } from '../Layout'
import Card from '../Card'
import styled from 'styled-components'

type Props = {
  instances: CourseData['course_instances']
}

export default (props: Props) => {
  let {data: userInstances} = useUserInstances()
  let instances = props.instances
    .filter(instance => {
      return userInstances?.course_instances.find(x => x.id === instance.id)
    })
  if(instances.length === 0) return null
  return h(Box,{gap: 16}, [
    h(Box, {gap: 8}, [
      h('h4', "You're Enrolled"),
      h('small', "Click the run to see the private forum"),
    ]),
    h(Box, {}, instances.map(instance => {
      return h(InstanceCard, {href: 'https://forum.hyperlink.academy/c/' + instance.id}, [
        h('h3', instance.id),
        h('h4', prettyDate(instance.start_date) + ' - ' + prettyDate(instance.end_date))
      ])
    })
    )
  ])
}

let prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})

let InstanceCard = styled(Card)`
padding: 16px;
`


    //href: 'https://forum.hyperlink.academy/g/' + props.instances[0].id
