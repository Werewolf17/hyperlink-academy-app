
import styled from 'styled-components'

export const Input = styled('input')`
border: 2px solid;
border-color: black;
padding: 5px 10px;
width: 100%;
margin-bottom: 10px;
box-sizing: border-box;

color: blue;
text-decoration: underline;

&:focus {
outline: none;
}
`

export const DateInput = styled(Input)`
display: inline;
width: 100%;
color: black;
`

export const FormContainer = styled('form')`
padding: 25px;
border: 2px solid;
box-shadow: 5px 5px lightblue;
max-width: 400px;
margin: auto;
`

export const Button = styled('button')`
border: none;
background: none;
padding:0;

color: blue;
text-decoration: underline;

margin-left: auto;
margin-right: 0;

&:hover {
cursor: pointer;
}
`
