import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import { useInstanceData, useUserData } from '../../../src/data'
import Link from 'next/link'
import Enroll from '../../../components/Course/Enroll'

const InstancePage = () => {
  let router = useRouter()
  let {data: user} = useUserData()
  let {data: instance} = useInstanceData(router.query.instanceID as string)
  if(instance === false) return null

  let userInInstance = instance?.people_in_instances.find(p => p.person_id === (user ? user.id : undefined))

  return h('div', [
    h(Link, {href: "/courses/[id]", as: `/courses/${router.query.id}`}, h('a', 'back to course')),
    h('div', [
      userInInstance ? null : h(Enroll, {id: router.query.instanceID as string}),
      h('h3', 'Learners'),
      h('ul', instance?.people_in_instances
        .map((person)=>{
          return h('li', [h(Link, {href: '/people/[id]', as: `/people/${person.person_id}`}, h('a', person.people.display_name))])
        }))
    ])
  ])
}
export default InstancePage
