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
    Name: "",
    Email: "",
    About: "",
    Experience: "",
    Timeline: "",
	Hours: "",
	Goals: "",
	Artifacts: "",
	Scheduling: ""
  })
  let[status, callApi] = useApi<SubmitFormMsg, SubmitFormResponse>([state])
  const onSubmit = (e:React.FormEvent) =>{
    e.preventDefault()
    callApi('/api/submitForm', {
      base: "appedbglZk1jTEyCS",
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
		Name: "",
		Email: "",
		About: "",
		Experience: "",
		Timeline: "",
		Hours: "",
		Goals: "",
		Artifacts: "",
		Scheduling: ""
    })}, "Submit another idea")
  ]) : h(Box, {ma: true, width: 640, gap:32}, [
    h(Box, [
      h('h1', "Propose a Learning Adventure"),
      h('p.big', `
Interested in joining Hyperlink's Learning Adventure Club? We'd love to hear what you
have in mind!`),
      h('p.big', `
Submit the form below, and if it's a good fit, we'll invite you to join an upcoming cohort.`),
    ]),
    h(Seperator),

    h(FormBox, {gap: 64, onSubmit}, [
      h(Box, {gap:32}, [
        h(LabelBox, {gap:8}, [
          h('h3', "Your Name"),
          h(Input, {
            type: "text",
            value: state.Name,
            onChange: e=>setState({...state, Name: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8}, [
          h('h3', "Your Email"),
          h(Input, {
            type: "email",
            value: state.Email,
            onChange: e=>setState({...state, Email: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "What's your project about, in a sentence or two?" ),
            h('small',`For example: I'm writing a book about personal librarianship; I'm doing a daily animation challenge; I'm reading through a curriculum on speculative futures`),
          ]),
          h(Textarea, {
            value: state.About,
            onChange: e=>setState({...state, About: e.currentTarget.value})
          })
		]),
		h(LabelBox, {gap:8},[
          h('div',[
            h('h3', "How would you rate your experience / comfort level in this area, on a scale of 1 to 5?"),
            h('small', `For example, if you're doing an painting project, 1 = I'm totally new to painting; 3 = I've taken a bunch of art classes; 3 = I've painted for years and had gallery shows`),
          ]),
          h(Input, {
            value: state.Experience,
            onChange: e=>setState({...state, Experience: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "What's your estimated project length / timeline?" ),
            h('small',`Is this a one-month project? A one-year project? Ongoing / TBD?`),
          ]),
          h(Textarea, {
            value: state.Timeline,
            onChange: e=>setState({...state, Timeline: e.currentTarget.value})
          })
        ]),
        h(LabelBox,{gap:8}, [
          h('div', [
            h('h3', "How many hours per week will you commit to working on it?" ),
            h('small',`Average is fine, but we'll expect some progress weekly. Be realistic!`),
          ]),
          h(Input, {
            value: state.Hours,
            onChange: e=>setState({...state, Hours: e.currentTarget.value})
          })
        ]),
        h(LabelBox, {gap:8},[
          h('div',[
            h('h3', "What are your main goals for this project?"),
            h('small', `In a couple sentences: what do you hope to get out of this? What does success / completion look like?`),
          ]),
          h(Textarea, {
            value: state.Goals,
            onChange: e=>setState({...state, Goals: e.currentTarget.value})
          })
		]),
		h(LabelBox, {gap:8},[
          h('div',[
            h('h3', "What might you make and share as an artifact?"),
            h('small', `For example: I'll publish a blog post with my reading notes twice a week; I'll share a daily Instagram post; I'll complete a book outline`),
          ]),
          h(Textarea, {
            value: state.Artifacts,
            onChange: e=>setState({...state, Artifacts: e.currentTarget.value})
          })
		]),
		h(LabelBox, {gap:8},[
          h('div',[
            h('h3', "What's the first month you can join? Any hard time constraints?"),
            h('small', `For example: "I'd like to start in February and can make any time outside weekdays 10am-6pm EST" (we'll keep this in mind as we plan future cohorts)`),
          ]),
          h(Textarea, {
            value: state.Scheduling,
            onChange: e=>setState({...state, Scheduling: e.currentTarget.value})
          })
		]),

      ]),
      h(Primary, {type: "submit", status, style:{justifySelf: "right"}}, "Submit")
    ])
  ])
}
