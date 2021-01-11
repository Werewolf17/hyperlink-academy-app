import styled from '@emotion/styled'
import h from 'react-hyperscript'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, Fragment, useEffect } from 'react'

import {colors, Mobile} from '../Tokens'
import { Logo } from '../Icons'
import { Box, Seperator, FormBox, LabelBox} from './index'
import { useUserData } from '../../src/data'
import { useMediaQuery } from '../../src/hooks'
import { Textarea, Input } from '../Form'
import { Secondary, Primary, LinkButton } from '../Button'
import { Modal } from '../Modal'
import { useApi } from '../../src/apiHelpers'
import { FeedbackMsg, FeedbackResult } from '../../pages/api/feedback'

const COPY = {
  feedbackTitle: "Tell us what's on your mind!",
  feedbackSuccess: "🎉 Thank you for your thoughts 🎉"
}

export default function Header() {
  const {data: user, mutate:mutateUser}= useUserData()
  let mobile = useMediaQuery('(max-width:420px)')
  return h(HeaderContainer, [
    h(Link, {href: user ? '/dashboard' : '/', passHref:true}, h('a', [Logo])),
    mobile ? h(MobileMenu, {user, mutateUser}) : h(Container, {}, [
      h(FeedbackModal),
      h(Link, {href: "/library", passHref: true}, h(NavLink, 'library')),
      h(LoginButtons, {user, mutateUser}),
      h(Link, {href: '/courses'}, h('a', {}, h(CoursesButton, 'courses')))
    ]),
  ])
}

const MobileMenu = (props:{user:any, mutateUser: any}) => {
  let [open, setOpen] = useState(false)
  let router = useRouter()
  useEffect(()=>{
    let handleRouteChange = ()=> setOpen(false)
    router.events.on('routeChangeComplete', handleRouteChange)
    return ()=>{ router.events.off('routeChangeComplete', handleRouteChange)}
  },[router])
  if(open) return h(FullPageOverlay, {}, h(Box, {gap: 32, padding: 24}, [
    h(HeaderContainer, [
      h(Link, {href: props.user ? '/dashboard' : '/', passHref:true}, h('a', [Logo])),
      h(NavLink, {style: {justifySelf: 'right'}, onClick: ()=> {setOpen(false)}}, 'close')
    ]),
    h(Link, {href: '/courses'}, h('a', {style:{textAlign:'right'}}, h(CoursesButton, 'courses'))),
    h(Box, {gap: 16, style: {textAlign: 'right'}}, [
      h(LoginButtons, props),
    ]),
    h(Link, {href: "/library", passHref:true}, h(NavLink, {style:{justifySelf: 'right'}}, 'library')),
    h(Seperator),
    h(Feedback)
  ]))
  else return h(NavLink, {style: {justifySelf: 'right'}, onClick:()=>setOpen(true)}, 'menu')
}

const LoginButtons = (props:{user:any, mutateUser:any}) => {
  let router = useRouter()
  let redirect = router.pathname === '/' ? '' : '?redirect=' + encodeURIComponent(router.asPath)
  if(!props.user) return h(Fragment, {}, [
    h(Link, {href: '/signup'}, h(NavLink,  'sign up')),
    h(Link, {href: '/login' + redirect}, h(NavLink, "log in")),
  ])
  else {
    return h(Fragment, [
      h(NavLink, {onClick: async (e)=>{
        e.preventDefault()
        let res = await fetch('/api/logout')
        if(res.status === 200) {
          props.mutateUser(false)
        }
      }}, 'logout')
    ])
  }
}

const Feedback = ()=> {
  let router = useRouter()
  let {data:user}= useUserData()
  let [form, setForm] = useState({email: '', feedback: ''})
  let [status, callFeedback, setStatus] = useApi<FeedbackMsg, FeedbackResult>([])
  let onSubmit = (e:React.FormEvent)=>{
    e.preventDefault()
    if(status==='success') return
    callFeedback('/api/feedback', {
      feedback:form.feedback,
      email: user ? undefined : form.email,
      page: router.pathname,
      username: user ? user.username : undefined
    })
  }

  if(status=== 'success') return h(Box, {style: {textAlign: 'center'}}, [
    COPY.feedbackSuccess,
    h('br'),
    h(LinkButton, {onClick: () => {
      setStatus('normal')
      setForm({...form, feedback: ''})
    }}, "I have more feedback!")
  ])
  return h(FormBox, {onSubmit, gap: 16}, [
    h('h4', COPY.feedbackTitle),
    h(Textarea, {value: form.feedback, required: true, onChange: e=>setForm({...form, feedback: e.currentTarget.value})}),
    user ? null : h(LabelBox, [
      h('h4', "Your email (optional)"),
      h(Input, {type: 'email', value: form.email, onChange: e=>setForm({...form, email: e.currentTarget.value})}),
    ]),
    h(Secondary, {
      type: 'submit',
      disabled: form.feedback === '',
      style:{justifySelf:'center'}
    }, "Submit")
  ])
}

const FeedbackModal = ()=>{
  let [display, setDisplay] = useState(false)
  return h(Fragment, [
    h(NavLink, {onClick: ()=>setDisplay(true)},'feedback'),
    h(Modal, {display, onExit: ()=>setDisplay(false)}, h(Feedback))
  ])
}

const CoursesButton = styled(Primary)`
color: blue;
background-color: white;
border-color: blue;
padding: 7px 16px;
`

const FullPageOverlay = styled('div')`
display: block;
position: fixed;
z-index: 11;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
background-color: white;
`

const Container = styled('div')`
justify-self: right;
align-self: center;
align-items: center;
display: grid;
grid-gap: 32px;
grid-auto-flow: column;
`

const NavLink = styled('a')`
font-family: 'Roboto Mono', monospace;
text-decoration: none;
color: ${colors.textSecondary};

&:visited {
color: ${colors.textSecondary};
}

&:hover {
cursor: pointer;
color: #00008B;
}
`

const HeaderContainer = styled('div')`
display: grid;
grid-template-columns: auto auto;
height: 32px;
padding-bottom: 64px;
align-items: center;

${Mobile} {
  padding-bottom: 32px ;
  padding-top: 16px ;
}
`

