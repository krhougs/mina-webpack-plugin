const fs = require('fs')
const path = require('path')
const { ConcatSource } = require('webpack-sources')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const DefinePlugin = require('webpack/lib/DefinePlugin')

const {
  CONFIG_FILE_NAME,
  PLUGIN_NAME,
  WORKER_CHUNK_NAME
} = require('./const')

const { resolve, normalizeOptions } = require('./utils')

const { getAppEntries } = require('./entry')

const {
  injectRouteEnv,
  addWorkerEntry,
  addAppEntry,
  addPageEntries
} = require('./add-entry')

module.exports = class MinaWebpackPlugin {
  constructor (options) {
    normalizeOptions(options, this)
  }

  apply (compiler) {
    this.compiler = compiler
    this.init()
  }

  init () {
    this.compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, normalModuleFactory => {
      normalModuleFactory.hooks.afterResolve.tapPromise(PLUGIN_NAME, data => {
        if (this.testAsset(data.rawRequest)) {
          data.loaders.push({
            loader: resolve('./asset-loader'),
            options: {
              basePath: this.basePath
            }
          })
        }
        return Promise.resolve(data)
      })
    })
    this.compiler.hooks.run.tapPromise(PLUGIN_NAME, this.resolveAppConfig.bind(this))
    this.compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, this.resolveAppConfig.bind(this))
    this.compiler.hooks.thisCompilation.tap(PLUGIN_NAME, this.setEntries.bind(this))
    this.compiler.hooks.compilation.tap(PLUGIN_NAME, this.decorateChunks.bind(this))
    this.compiler.hooks.afterEmit.tap(PLUGIN_NAME, this.ensureRequire.bind(this))
  }

  async resolveAppConfig (compiler) {
    const entries = getAppEntries.bind(this)(
      require(path.resolve(this.basePath, CONFIG_FILE_NAME)),
      compiler
    )
    this.workerEntry = entries.worker
    this.appEntries = entries.app
    this.packageNames = entries.packageNames
    this.packageEntries = (() => {
      const ret = {}
      for (const p of entries.packageNames) {
        ret[p] = entries[p].pages
      }
      return ret
    })()

    this.applySplitting()

    return entries
  }

  applySplitting () {
    const nodeModuleRegex = /[\\/]node_modules[\\/]/
    const groupBase = {
      minChunks: 2,
      reuseExistingChunk: true,
      enforce: true
    }
    const cacheGroups = {}
    for (const packageName of this.packageNames) {
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

  setEntries (compilation) {
    injectRouteEnv.call(this)
    addWorkerEntry.call(this)
    addAppEntry.call(this, compilation)
    addPageEntries.call(this, compilation)
  }

  decorateChunks (compilation) {
    const chunkNameRegex = /^(.+)\/(pages|components).+$/
    const windowRegExp = new RegExp('window', 'g')
    compilation.chunkTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
    compilation.mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
      let groupName
      if (chunk.name === WORKER_CHUNK_NAME) {
        groupName = WORKER_CHUNK_NAME
      } else {
        groupName = chunk.name === 'app'
          ? 'main' : chunk.name.match(chunkNameRegex)[1]
        const relativePath = path.relative(
          path.dirname(path.resolve(this.basePath, chunk.name)),
          path.resolve(this.basePath, `${groupName}/include`)
        )
        const posixPath = relativePath.replace(/\\/g, '/')
        const injectContent = ['common', 'vendor']
          .map(i => `require('./${posixPath}.${i}.js')`)
          .join(';')
        source.add(';' + injectContent)
      }

      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
  }

  ensureRequire () {
    const outputPath = this.compiler.options.output.path
    for (const n of this.packageNames) {
      ['common', 'vendor'].forEach(i => {
        const filename = path.resolve(outputPath, n, `./include.${i}.js`)
        const exists = fs.existsSync(filename)
        if (!exists) {
          fs.writeFileSync(filename, '')
        }
      })
    }
  }
}
