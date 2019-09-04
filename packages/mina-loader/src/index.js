import { getOptions } from 'loader-utils'

export default function (content, map, data) {
  const options = getOptions(this)

  return `'use mina'\nmodule.exports = ${JSON.stringify({
    content,
    options
  })}`
}
