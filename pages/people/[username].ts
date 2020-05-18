import h from 'react-hyperscript'
import { useRouter } from 'next/router'
import { useProfileData } from '../../src/data'
import { Error } from '../../components/Form'
import Loader from '../../components/Loader'
import { Box } from '../../components/Layout'

const Profile= ()=>{
  let router = useRouter()
  let username = router.query.username as string
  let {data: person} = useProfileData(username)
  if(person === undefined) return h(Loader)
  if(person === false) return h(Error, 'No user found :(')

  return h(Box, {gap: 16}, [
    h('h1', person.display_name || username),
    !person.link ? null : h('a', {href: person.link}, person.link),
    !person.bio ? null : h('div', person.bio)
  ])
}

export default Profile
