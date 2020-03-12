import fauna from 'faunadb'
let secret = process.env.FAUNA_KEY
if(!secret) throw new Error('FAUNA_KEY environment variable not provided!')
export const client = new fauna.Client({secret: process.env.FAUNA_KEY as string})
