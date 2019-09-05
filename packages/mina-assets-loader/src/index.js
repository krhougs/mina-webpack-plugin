import { getOptions, interpolateName } from 'loader-utils'
import path from 'path'

import { rfs } from './utils'

const cssModuleRegex = /require\("(.+)\/node_modules\//

function findEntry (mod) {
  if (mod.reasons.length > 0 && mod.reasons[0]?.module?.resource) {
    return findEntry(mod.reasons[0].module)
  }
  return mod
}

export default function (content, map, data) {
  const options = {
    template: false,
    stylesheets: false,
    cssModules: false,
    useRelativePath: true,
    ...getOptions(this)
  }

  if (options.stylesheets && options.cssModules) {
    const module = rfs(
      String(content).replace(cssModuleRegex, 'require("')
    )

    return `'use mina'
      module.exports = ${JSON.stringify({
        ...module.locals,
        __MINA: {
          options,
          stylesheets: module.toString()
        }
      })}`
  }

  if (options.stylesheets || options.template) {
    return `'use mina'\nmodule.exports = ${JSON.stringify({
      content: String(content),
      options
    })}`
  }

  let entry
  let page

  try {
    const entryNames = findEntry(this._module)
      .reasons[0].dependency.loc.name
      .split('/').filter(i => i)
    entry = entryNames[0]
    page = entryNames[2]
  } catch (error) {
    entry = 'main'
  }

  const entryPrefix = entry === 'main' ? 'main/' : ''
  const outputFilename = interpolateName(
    this,
    '[name].[hash:12].[ext]',
    {
      context: this.rootContext,
      content
    }
  )

  const outputPath = `/${entryPrefix}assets/${outputFilename}`
  this.emitFile(outputPath, content)

  if (!page || !options.useRelativePath) {
    return `module.exports = ${JSON.stringify(outputPath)}`
  }

  let relativePath
  try {
    const pagePath = `${entry}/pages/${page}/`
    relativePath = path.relative(
      pagePath,
      `${entry}/assets/${outputFilename}`
    )
  } catch (error) {
    relativePath = outputPath
  }

  return `module.exports = ${JSON.stringify(relativePath)}`
}

export const raw = true
