const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')

function applyAppChunk (entryMap, compilation) {
  const app = entryMap.app

  compilation.assets['app.json'] = {
    source: () => app.json,
    size: () => app.json.length
  }

  new SingleEntryPlugin(
    this.basePath + '/',
    this.remax ? `${app.js.request}?remaxApp` : app.js.request,
    'app'
  ).apply(this.compiler)
}

function applyPageChunks (entryMap, compilation) {
  for (const packageName of entryMap.packageNames) {
    for (const page of entryMap[packageName].pages) {
      this::applyComponentChunk(page, compilation, this.compiler)
    }
  }
}

function applyComponentChunk (config, compilation, compiler) {
  new SingleEntryPlugin(
    this.basePath,
    this.remax ? `${config.js.request}?remaxPage` : config.js.request,
    config.distBasePath
  ).apply(this.compiler)
  compilation.assets[`${config.distBasePath}.json`] = {
    source: () => config.json,
    size: () => config.json.length
  }
}

function applyChunks (compilation) {
  const entryMap = this.entryMap

  this::applyAppChunk(entryMap, compilation)
  this::applyPageChunks(entryMap, compilation)

  return []
}

export default function (plugin, ...args) {
  return plugin::applyChunks(...args)
}
