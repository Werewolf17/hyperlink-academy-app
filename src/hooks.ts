import {useRef, useEffect} from 'react'
export const useDebouncedEffect = (callback:Function, delay:number, deps:any[])  => {
  const firstUpdate = useRef(true);
  useEffect(()=>{
    if(firstUpdate.current) {
      firstUpdate.current = false
      return
    }
    const handler = setTimeout(()=>{
      callback()
    }, delay)

    return ()=>{
      clearTimeout(handler)
    }
  }, [delay, ...deps])
}
