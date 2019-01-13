const fs = require('fs')
const path = require('path')
const { ConcatSource } = require('webpack-sources')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const DefinePlugin = require('webpack/lib/DefinePlugin')

const { getAppEntries } = require('./entry')

const PLUGIN_NAME = 'MinaWebpackPlugin'

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

function normalizeOptions (options, thisArg) {
  const _options = options || {}
  const defaultOptions = {
    basePath: null,
    entryName: 'app',
    entryChunkName: 'common',
    extensions: ['.js'],
    assetExtensions: ['.wxml', '.wxss', '.pug', '.styl', '.scss'],
    vendorFilename: 'common.js'
  }

  const extensions = Array.from(new Set([
    ...defaultOptions.extensions,
    ...(_options.extensions || [])
  ]))
  const assetExtensions = Array.from(new Set([
    ...defaultOptions.assetExtensions,
    ...(_options.assetExtensions || [])
  ]))

  const ret =  Object.assign({}, defaultOptions, options, {
    extensions,
    assetExtensions
  })

  Object.getOwnPropertyNames(ret).forEach(i => {
    thisArg[i] = ret[i]
  })

  return ret
}

module.exports = class MinaWebpackPlugin {
  constructor (options) {
    normalizeOptions(options, this)
  }

  apply (compiler) {
    this.compiler = compiler
    this.init()
  }

  init () {
    this.compiler.hooks.run.tapPromise(PLUGIN_NAME, this.resolveAppConfig.bind(this))
    this.compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, this.resolveAppConfig.bind(this))
    this.compiler.hooks.thisCompilation.tap(PLUGIN_NAME, this.setEntries.bind(this))
    this.compiler.hooks.compilation.tap(PLUGIN_NAME, this.decorateChunks.bind(this))
    this.compiler.hooks.afterEmit.tap(PLUGIN_NAME, this.ensureRequire.bind(this))
  }

  async resolveAppConfig (compiler) {
    const entries = getAppEntries.bind(this)(
      require(path.resolve(this.basePath, '_.config.js')),
      compiler
    )
    
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
          return module.resource
            && !module.resource.match(nodeModuleRegex)
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
    new DefinePlugin({
      'process.env.APP_ROUTES': JSON.stringify((() => {
        const ret = {}
        Object.entries(this.packageEntries)
          .forEach(({ 0: k, 1: v }) => {
            ret[k] = {}
            v.forEach(i => {
              ret[k][i.key] = '/' + i.distBasePath
            })
          })
        return ret
      })()),
      'process.env.APP_ROUTES_DETAIL': JSON.stringify(this.packageEntries)
    }).apply(this.compiler)

    // add entries for app
    new MultiEntryPlugin(
      this.appEntries.basePath,
      [
        `${resolve('./app-loader.js')}!${this.appEntries.js.request}`,
        this.appEntries.style.request && `file-loader?name=app.wxss!${this.appEntries.style.request}`
      ].filter(i => i),
      'app'
    ).apply(this.compiler)
    compilation.assets['app.json'] = {
      source: () => this.appEntries.json,
      size: () => this.appEntries.json.length
    }

    // add entries for pages
    for (const packageName of this.packageNames) {
      for (const page of this.packageEntries[packageName]) {
        const fileName = page.distBasePath
        new MultiEntryPlugin(
          page.basePath,
          [
            `${resolve('./page-loader.js')}!${page.js.request}`,
            `file-loader?name=${fileName}.wxml!${page.template.request}`,
            page.style.request && `file-loader?name=${fileName}.wxss!${page.style.request}`
          ].filter(i => i),
          fileName
        ).apply(this.compiler)
        compilation.assets[`${fileName}.json`] = {
          source: () => page.json,
          size: () => page.json.length
        }  
      }
    }
  }

  decorateChunks (compilation) {
    const chunkNameRegex = /^(.+)\/(pages|components).+$/
    const windowRegExp = new RegExp('window', 'g')
    compilation.chunkTemplate.hooks.render.tap(PLUGIN_NAME, (source, { name }) => {
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
    compilation.mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
      const groupName = chunk.name === 'app'
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
