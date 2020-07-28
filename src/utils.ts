export const prettyDate = (str: string) =>  ( new Date(str) ).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric', timeZone: "UTC"})

export const slugify = (str:string) => {
  var specials = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~’]/g
  return str.trim()
    .replace(specials, '')
    .replace(/\s/g, '-')
}
