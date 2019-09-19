import h from 'react-hyperscript'
import {useState, useEffect } from 'react'

export default  () => {
  let [dots, setDots] = useState(1)
  useEffect(() => {
    let id = setInterval(()=> {
      setDots(count => (count+1) % 4)
    }, 500)
    return () => {
      clearInterval(id)
    }
  }, [])
  return h('div', 'loading' + '.'.repeat(dots))
}
