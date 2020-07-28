import {useRef, useEffect, useState} from 'react'
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

export const useMediaQuery = (query: string) => {
  let [match, setMatch] = useState(false)
  useEffect(()=>{
    let mediaQuery = window.matchMedia(query)
    setMatch(mediaQuery.matches)
    let listener = ()=>{
      setMatch(mediaQuery.matches)
    }
    mediaQuery.addListener(listener)
    return ()=> mediaQuery.removeListener(listener)
  },[query])
  return match
}
