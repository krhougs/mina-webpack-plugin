const path = require('path')
const { ConcatSource } = require('webpack-sources')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')

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
    return entries
  }

  setEntries (compilation) {
    // add entries for app
    new MultiEntryPlugin(
      this.appEntries.basePath,
      [
        `${resolve('./app-loader.js')}!${this.appEntries.js.request}`,
        this.appEntries.style.request && `file-loader?name=app.wxss!extract-loader!${this.appEntries.style.request}`
      ].filter(i => i),
      'app'
    ).apply(this.compiler)
    compilation.assets['app.json'] = {
      source: () => this.appEntries.json,
      size: () => this.appEntries.json.length
    }

    // add entries for pages
    for (const packageName of this.packageNames) {
      console.log(this.packageEntries[packageName])
      for (const page of this.packageEntries[packageName]) {
        const fileName = `${packageName}/pages/${page.key}/${page.key}`
        new MultiEntryPlugin(
          page.basePath,
          [
            `${resolve('./page-loader.js')}!${page.js.request}`,
            `file-loader?name=${fileName}.wxml!${page.template.request}`,
            page.style.request && `file-loader?name=${fileName}.wxss!extract-loader!${page.style.request}`
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
    // new SplitChunksPlugin({
    //   chunks: 'all',
    //   minSize: 0,
    //   maxInitialRequests: 1024,
    //   name: true,
    //   filename: `./${this.vendorFilename}`,
    //   automaticNameDelimiter: '~',
    //   cacheGroups: {
    //     common: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'common',
    //       chunks: 'all',
    //       minChunks: 2,
    //       reuseExistingChunk: true
    //     }
    //   }
    // }).apply(this.compiler)
    compilation.chunkTemplate.hooks.render.tap(PLUGIN_NAME, (source, { name }) => {
      const windowRegExp = new RegExp('window', 'g')
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
    compilation.mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
      // return source
      const windowRegExp = new RegExp('window', 'g')
      const relativePath = path.relative(path.dirname(path.resolve(this.basePath, chunk.name)), path.resolve(this.basePath, this.vendorFilename))
      const posixPath = relativePath.replace(/\\/g, '/')
      // eslint-disable-next-line max-len
      // const injectContent = `;require("./${posixPath}");`
      // source.add(injectContent)
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
  }
}
