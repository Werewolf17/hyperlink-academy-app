'use strict'

var graymatter = require('gray-matter')

module.exports = async function(src) {
  const callback = this.async()
  let {data, content} = graymatter(src)
  let withHeader= `
export const metadata = ${JSON.stringify(data)}

${content}

`
  return callback(null, withHeader)
}
