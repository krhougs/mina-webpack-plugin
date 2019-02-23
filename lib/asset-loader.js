const path = require('path')
const { interpolateName } = require('loader-utils')

function findEntry (mod) {
  if (mod.reasons.length > 0 && mod.reasons[0].module.resource) {
    return findEntry(mod.reasons[0].module)
  }
  return mod
}

function AssetLoader (content, map, meta) {
  let entry = null
  let page = null
  try {
    const entryNames = findEntry(this._module)
      .reasons[0].dependency.loc.name
      .split('/')
      .filter(i => i)
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

  if (!page) {
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

module.exports = AssetLoader
