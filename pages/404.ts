import h from 'react-hyperscript'
import Link from 'next/link'

import {Box} from 'components/Layout'
import { useUserData } from 'src/data'

export default ()=>{
  let {data: user} = useUserData()

  return h(Box, {style: {textAlign: 'center', width: 'fit-content', margin: 'auto'}}, [
    h('h1', '404'),
    h('p', "This page doesn't exist :("),
    h('p', "It could be bad link, or maybe we're just still working on it!"),
    h(Link, {href: user ? '/dashboard' : '/'}, h('a.mono', 'take me back to the homepage'))
  ])
}
