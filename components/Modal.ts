import styled from '@emotion/styled'
import h from 'react-hyperscript'
import { Fragment, useState, useEffect } from 'react'

export const Modal:React.SFC<{display:boolean, onExit?: Function}> = (props)=>{
  let [display, setDisplay] =  useState(props.display)
  useEffect(()=>setDisplay(props.display), [props])
  if(!display) return null
  return h(Fragment, [
    h(ModalBlur, {onClick: ()=>{
      setDisplay(false)
      if(props.onExit) props.onExit()
    }}),
    h(ModalBox, {}, [props.children as React.ReactElement])
  ])
}

export const ModalBox = styled('div')`
position: fixed;
border: 2px solid;
background-color: white;
width: 400px;
padding: 32px;
left: 50%;
top: 50%;
transform: translate(-50%, -50%);
`

export const ModalBlur = styled('div')`
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
backdrop-filter: blur(2.5px);
`
