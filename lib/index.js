const { ConcatSource } = require('webpack-sources')
const path = require('path')
const fsExtra = require('fs-extra')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin')

const PLUGIN_NAME = 'MinaWebpackPlugin'

function normalizeOptions (options) {
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

  return Object.assign({}, defaultOptions, options, {
    extensions,
    assetExtensions
  })
}

function resolveBasePath (compiler) {
  if (this.options.basePath) { return path.resolve(this.options.basePath) }

  const appEntry = compiler.options.entry[this.options.entryName]
  if (!appEntry) { throw new TypeError('Entry invalid.') }
  return path.resolve(path.dirname(appEntry))
}

module.exports = class MinaWebpackPlugin {
  constructor (options) {
    this.options = normalizeOptions(options)
    this.appEntries = []
  }

  apply (compiler) {
    // initialization
    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, this.setBasePath.bind(this))
    compiler.hooks.run.tapPromise(PLUGIN_NAME, this.setAppEntries.bind(this))
    compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, this.setAppEntries.bind(this))

    // split commons chunk
    this.applyPlugins(compiler)
    // decorating output to suit WeixinJSBridge runtime
    compiler.hooks.compilation.tap(PLUGIN_NAME, this.decorateChunks.bind(this))

    // dealing with entries
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      this.addEntries(compiler)
      this.writeJsons(compiler, compilation)
    })
  }

  setBasePath (compiler) {
    this.basePath = resolveBasePath.call(this, compiler)
  }

  async setAppEntries (compiler) {
    this.appEntries = await this.resolveAppEntries()
  }

  async addEntries (compiler) {
    for (const name of this.appEntries) {
      for (const ext of this.options.extensions) {
        const fullPath = path.resolve(this.basePath, name + ext)
        if (fsExtra.existsSync(fullPath)) {
          new SingleEntryPlugin(`${this.basePath}/`, `./${name + ext}`, name).apply(compiler)
        }
      }
      const assets = this.options.assetExtensions
        .map(ext => path.resolve(this.basePath, name + ext))
        .filter(f => fsExtra.existsSync(f))
      new MultiEntryPlugin(
        this.basePath,
        assets,
        this.options.entryChunkName
      ).apply(compiler)
    }

    const tabBarAssets = this.appEntries.tabBarAssets
    if (tabBarAssets && tabBarAssets.length) {
      new MultiEntryPlugin(
        this.basePath,
        tabBarAssets.map(i => path.resolve(this.basePath, i)),
        this.options.entryChunkName
      ).apply(compiler)
    }
  }

  writeJsons (compiler) {
    compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const cache = compilation.cache || {}
      const cacheKeys = Object.keys(cache)
      for (const name of this.appEntries) {
        const file = path.resolve(this.basePath, name + '.json')
        const cacheKey = cacheKeys.filter(function (key) {
          return cache[key].resource === file
        })
        const cacheAsset = cache[cacheKey]
        if (cacheAsset && !cacheAsset.built) { return }
        const data = fsExtra.readJsonSync(file)

        if (name === 'app' && data.tabBar && data.tabBar.list && data.tabBar.list.length && this.appEntries.tabBarAssets) {
          const tabBarAssetFullPaths = this.appEntries.tabBarAssets
            .map(ii => path.resolve(this.basePath, ii))
          const tabBarAssets = []

          compilation.modules
            .filter(i => tabBarAssetFullPaths.indexOf(i.userRequest) > -1)
            .forEach(i => {
              tabBarAssets.push({
                key: path.relative(this.basePath, i.userRequest),
                value: Object.keys(i.buildInfo.assets)[0]
              })
            })
          data.tabBar.list = data.tabBar.list.map(i => {
            for (const a of tabBarAssets) {
              if (i.iconPath) { i.iconPath = i.iconPath.replace(a.key, a.value) }
              if (i.selectedIconPath) { i.selectedIconPath = i.selectedIconPath.replace(a.key, a.value) }
            }
            return i
          })
        }

        const content = JSON.stringify(data)
        const size = content.length
        compilation.assets[name + '.json'] = {
          size () { return size },
          source () { return content }
        }
      }
      callback()
    })
  }

  applyPlugins (compiler) {
    new SplitChunksPlugin({
      chunks: 'all',
      minSize: 0,
      maxInitialRequests: 1024,
      name: true,
      filename: `./${this.options.vendorFilename}`,
      automaticNameDelimiter: '~',
      cacheGroups: {
        common: {
          test: /[\\/]node_modules[\\/]/,
          name: 'common',
          chunks: 'all',
          minChunks: 2,
          reuseExistingChunk: true
        }
      }
    }).apply(compiler)
  }

  decorateChunks (compilation) {
    compilation.chunkTemplate.hooks.render.tap(PLUGIN_NAME, (source, { name }) => {
      const windowRegExp = new RegExp('window', 'g')
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
    compilation.mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
      // return source
      const windowRegExp = new RegExp('window', 'g')
      const relativePath = path.relative(path.dirname(path.resolve(this.basePath, chunk.name)), path.resolve(this.basePath, this.options.vendorFilename))
      const posixPath = relativePath.replace(/\\/g, '/')
      // eslint-disable-next-line max-len
      const injectContent = `;require("./${posixPath}");`
      source.add(injectContent)
      return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
    })
  }

  async resolveAppEntries () {
    const minaAppConfig = fsExtra.readJSONSync(path.resolve(this.basePath, 'app.json'))

    const pages = minaAppConfig.pages

    let tabBarAssets = new Set()
    if (minaAppConfig.tabBar && minaAppConfig.tabBar.list) {
      minaAppConfig.tabBar.list.forEach(i => {
        if (i.selectedIconPath) { tabBarAssets.add(i.selectedIconPath) }
        if (i.iconPath) { tabBarAssets.add(i.iconPath) }
      })
      tabBarAssets = tabBarAssets.size ? Array.from(tabBarAssets) : null
    }

    if (minaAppConfig.subPackages && minaAppConfig.subPackages.length) {
      for (const sp of minaAppConfig.subPackages) {
        for (const spp of sp.pages) {
          pages.push(path.join(sp.root, spp))
        }
      }
    }

    let pageComponents = new Set()
    for (const page of pages) {
      await this.getComponents(pageComponents, path.resolve(this.basePath, page))
    }
    pageComponents = pageComponents.size ? Array.from(pageComponents) : null

    const ret = ['app', ...pages, ...pageComponents]

    Object.defineProperties(ret, {
      pages: { get: () => pages },
      components: { get: () => pageComponents },
      tabBarAssets: { get: () => tabBarAssets }
    })
    return ret
  }

  async getComponents (components, instance) {
    const { usingComponents = {} } = await fsExtra.readJson(`${instance}.json`)
    const componentBase = path.parse(instance).dir
    for (const c of Object.values(usingComponents)) {
      if (c.indexOf('plugin://') === 0) { continue }

      const component = path.resolve(componentBase, c)
      if (!components.has(component)) {
        components.add(path.relative(this.basePath, component))
        await this.getComponents(components, component)
      }
    }
  }

  getFullAssetPath (assetPath) {
    return path.resolve(this.basePath, assetPath)
  }
}
