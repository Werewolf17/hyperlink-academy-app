import h from 'react-hyperscript'

export default ()=>{
  return h('div', [
    h('button', {onClick: ()=> {throw new Error('this is an erro')}}, 'error')
  ])
}
