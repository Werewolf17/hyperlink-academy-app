import h from 'react-hyperscript'
import { useRouter } from 'next/router'
const Profile= ()=>{
  let router = useRouter()
  return h('div', router.query.id)
}

export default Profile
