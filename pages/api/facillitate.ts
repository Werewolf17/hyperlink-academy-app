import { NextApiRequest, NextApiResponse} from 'next'
import airtable from 'airtable'
import fetch from 'isomorphic-unfetch'


type Body = {
  name: string
  description: string,
  webpage: string,
  start: string,
  end: string
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
  let base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appI77uDPls9eA4xr');
  const body:Partial<Body> = JSON.parse(req.body)
  try {
    await base('Courses').create([
      {
        fields: {
          name: body.name,
          description: body.description,
          webpage: body.webpage,
          start: body.start,
          end: body.end,
          approved: false
        }
      }
    ])
    res.status(200).end()
  }
  catch(e) {
    console.log(JSON.stringify(e))
    res.status(400).end()
  }
}

export const FacillitateAPI = (body: Body) => {
  return fetch('/api/facillitate', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
