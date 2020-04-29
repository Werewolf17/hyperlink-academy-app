import { NextApiRequest, NextApiResponse} from 'next'

export type Handler = (req:Request) => Promise<Result>
type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
export type ResultType<T extends (...args:any)=> any> = PromiseReturn<ReturnType<T>>
export type Request = NextApiRequest

type Result = {
  status: number,
  result: string | object | null | boolean
  headers?: {
    [key: string]: string | number | string[]
  }
}

export const APIHandler = (handler: Handler) => {
  return async (req:NextApiRequest, res: NextApiResponse) => {
    let result = await handler(req)
    if(result.headers) {
      for(let header of Object.keys(result.headers)) {
        res.setHeader(header, result.headers[header])
      }
    }
    if(typeof result.result !== 'object') return res.status(result.status).send(result.result)
    return res.status(result.status).json(result.result)
  }
}

export const multiRouteHandler = (query:string, handlers:{[key:string]: Handler}) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let route = ((typeof req.query[query] === 'string')
                 ? req.query[query]
                 : req.query[query][0]) as string
    let result = await handlers[route](req)
    if(result.headers) {
      for(let header of Object.keys(result.headers)) {
        res.setHeader(header, result.headers[header])
      }
    }
    if(typeof result.result === 'object' || typeof result.result === 'boolean') {
      return res.status(result.status).json(result.result)
    }
    return res.status(result.status).send(result.result)
  }
}

export async function callApi<Msg extends object | string | null, R extends Omit<Result, 'headers'>> (endpoint:string, msg?: Msg){
    let result = await fetch(endpoint, {
      method: msg ? "POST" : "GET",
      headers: {
        'Content-type': (typeof msg === 'object') ? 'application/json' : 'text/html'
      },
      body: (typeof msg === 'string') ? msg : JSON.stringify(msg)
    })

    return {
      status: result.status,
      result: result.headers.get('Content-type')?.includes('application/json')
        ? await result.json()
        : await result.text()
    } as R
}
