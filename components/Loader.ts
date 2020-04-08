import h from 'react-hyperscript'
import {useState, useEffect } from 'react'

export default  () => {
  let [dots, setDots] = useState(1)
  useEffect(() => {
    let id = setInterval(()=> {
      setDots(count => (count+1) % 4)
    }, 250)
    return () => {
      clearInterval(id)
    }
  }, [])
  return h('div', '.'.repeat(dots) + '\u00a0'.repeat(3-dots))
}
