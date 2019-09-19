import { NextApiRequest, NextApiResponse} from 'next'
import airtable from 'airtable'
import fetch from 'isomorphic-unfetch'


type Body = {
  name: string
  email: string,
  webpage: string,
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
  let base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appI77uDPls9eA4xr');
  const body:Partial<Body> = JSON.parse(req.body)
  try {
    await base('Learners').create([
      {
        fields: {
          name: body.name,
          email: body.email,
          webpage: body.webpage,
          approved: false,
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

export const enrollAPI =(body: Body) => {
  return fetch('/api/enroll', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
