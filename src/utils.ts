import { loadStripe } from '@stripe/stripe-js/pure'

export const prettyDate = (str: string) =>  {
  let date = new Date(str)
  let today = new Date()
  if(date.getDate()===today.getDate() &&
    date.getMonth()===today.getMonth() &&
    date.getFullYear()===today.getFullYear()) return "today"
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
}

export const slugify = (str:string) => {
  var specials = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~’]/g
  return str.trim()
    .replace(specials, '')
    .replace(/\s/g, '-')
    .toLowerCase()
}

export const usernameValidate = (s:string) => /^[a-zA-Z0-9_.\-]{3,15}$/.test(s)

export function getTimeBetween(d1: Date, d2:Date) {
  return ((d2.getTime() - d1.getTime()) / (1000 * 60 * 60)).toFixed(1)
}


let stripePromise:ReturnType<typeof loadStripe>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)
  }
  return stripePromise
}
