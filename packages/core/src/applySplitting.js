import SplitChunksPlugin from 'webpack/lib/optimize/SplitChunksPlugin'

function applySplitting (entryMap) {
  const nodeModuleRegex = /[\\/]node_modules[\\/]/
  const groupBase = {
    minChunks: 2,
    reuseExistingChunk: true,
    enforce: true
  }
  const cacheGroups = {}
  for (const packageName of entryMap.packageNames) {
    const chunkRegex = new RegExp(`^${packageName}\\/(.+)$`, 'g')
    const testChunk = function (chunk) {
      if (packageName === 'main' && chunk.name === 'app') { return true }
      return chunk.name && chunk.name.match(chunkRegex)
    }

    cacheGroups[`${packageName}Vendor`] = {
      test: nodeModuleRegex,
      chunks: testChunk,
      name: `${packageName}/include.vendor`,
      ...groupBase
    }
    cacheGroups[`${packageName}Common`] = {
      test (module) {
        if (module.request?.indexOf && module.request.indexOf('mina-assets-loader') > -1) {
          return false
        }
        return module.resource &&
          !module.resource.match(nodeModuleRegex)
      },
      chunks: testChunk,
      name: `${packageName}/include.common`,
      ...groupBase
    }
  }
  new SplitChunksPlugin({
    chunks: 'all',
    minSize: 0,
    maxInitialRequests: 1024,
    name: false,
    automaticNameDelimiter: '~',
    cacheGroups
  }).apply(this.compiler)
}

export default function (plugin, ...args) {
  return plugin::applySplitting(...args)
}
