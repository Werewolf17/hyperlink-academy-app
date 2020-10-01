import h from 'react-hyperscript'
import { Box, FormBox, LabelBox, Seperator } from 'components/Layout'
import { Textarea, Input } from 'components/Form'
import { useApi } from 'src/apiHelpers'
import {SubmitFormMsg, SubmitFormResponse} from 'pages/api/submitForm'
import { useState } from 'react'
import { Primary } from 'components/Button'
import { AccentImg } from 'components/Images'

export default ()=>{
  let [state, setState] = useState({
    Email: "",
    Name: "",
    About: "",
    Structure: "",
    Cost: "",
    References: ""
  })
  let[status, callApi] = useApi<SubmitFormMsg, SubmitFormResponse>([state])
  const onSubmit = (e:React.FormEvent) =>{
    e.preventDefault()
    callApi('/api/submitForm', {
      base: "appbYajLwQVdNDarG",
      data: state
    })
  }
  return status === 'success' ? h(Box, {style:{justifyItems:'center'}, gap:32}, [
    h(Box,{style:{textAlign: 'center', justifyItems: "center"}}, [
      h(AccentImg, {src: '/img/plane.gif', alt: "an animated gif of a paper airplane taking off" }),
      h('h1', "Thank You!"),
      h('p.big', `We'll get back to you soon! `),
    ]),
    h(Primary, {onClick: ()=>setState({
      Email: "",
      Name: "",
      About: "",
      Structure: "",
      Cost: "",
      References: ""
    })}, "Submit another idea")
  ]) : h(Box, {ma: true, width: 640, gap:32}, [
    h(Box, [
      h('h1', "Request for Clubs"),
      h('p.big', `
If you're interested in running a Club on Hyperlink, we'd love to hear what you
have in mind! Rough ideas are fine; we can chat more about the details.`),
      h('p.big', [h('b', 'IMPORTANT: '), `
Clubs are intended to be more lightweight than courses, but if you
run one, we expect you to take it seriously and commit to facilitating for the
full duration.`]),
    ]),
    h(Seperator),

    h(FormBox, {gap: 64, onSubmit}, [
      h(Box, {gap:32}, [
        h(LabelBox, {gap:8}, [
          h('h3', "Email"),
          h(Input, {
            type: "email",
            value: state.Email,
            onChange: e=>setState({...state, Email: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8}, [
          h('h3', "Your name"),
          h(Input, {
            type: "text",
            value: state.Name,
            onChange: e=>setState({...state, Name: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "What's the club about?" ),
            h('small',`In a few words, e.g. "Book club for GEB", or "Working group exploring the future of internet pedagogy"`),
          ]),
          h(Textarea, {
            value: state.About,
            onChange: e=>setState({...state, About: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "What does the structure look like?" ),
            h('small',`In a few short paragraphs: what are the goals of the Club? How long is it and how frequently does it meet? What's the workload? Who's the ideal participant?`),
          ]),
          h(Textarea, {
            value: state.Structure,
            onChange: e=>setState({...state, Structure: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "How much do you imagine it will cost?" ),
            h('small',`In USD; rough estimate fine for now. As a serious learning experience, the cost should be > $0! (Our pricing model here is the same as for courses: you set a price, Hyperlink takes a 20% platform fee, you keep 80%)`),
          ]),
          h(Input, {
            value: state.Cost,
            onChange: e=>setState({...state, Cost: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8},[
          h('div',[
            h('h3', "Anything else we should check out? (Optional)"),
            h('small', "Feel free to share your website, Twitter, or other links that might help illustrate what you have in mind!"),
          ]),
          h(Textarea, {
            value: state.References,
            onChange: e=>setState({...state, References: e.currentTarget.value})
          })
        ]),

      ]),
      h(Primary, {type: "submit", status, style:{justifySelf: "right"}}, "Submit")
    ])
  ])
}