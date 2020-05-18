import { NextApiRequest, NextApiResponse} from 'next'

export type ResultType<T extends (...args:any)=> any> = PromiseReturn<ReturnType<T>>
export type Request = NextApiRequest
export type Successful<T extends Result> = Extract<T, {status: 200}>['result']

type Handler = (req:Request) => Promise<Result>
type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T

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
  return APIHandler(async (req) => {
    let route = (typeof req.query[query] === 'string')
                 ? req.query[query] as string
                 : req.query[query][0]
    return handlers[route](req)
  })
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
