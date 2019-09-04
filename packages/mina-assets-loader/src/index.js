import { getOptions } from 'loader-utils'

import { rfs } from './utils'

const cssModuleRegex = /require\("(.+)\/node_modules\//
// const cssModuleRegex = /require\("(.+)\/node_modules\/(.+)/

export default function (content, map, data) {
  const options = getOptions(this)

  if (options.stylesheets && options.cssModules) {
    const module = rfs(
      content.replace(cssModuleRegex, 'require("')
    )

    return `'use mina'\nmodule.exports = ${JSON.stringify({
      ...module.locals,
      __MINA: {
        options,
        stylesheets: module.toString()
      }
    })}`
  }

  return `'use mina'\nmodule.exports = ${JSON.stringify({
    content,
    options
  })}`
}
