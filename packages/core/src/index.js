import path from 'path'
import { resolve } from './utils'

import { PLUGIN_NAME } from './constants'

import getEntryMap from './getEntryMap'
import applySplitting from './applySplitting'
import applyChunks from './applyChunks'
import applyChunkDecorations from './applyChunkDecorations'
import applyChunkAssets from './applyChunkAssets'
import ensureRequire from './ensureRequire'

export default class MinaWebpackPlugin {
  constructor (options) {
    this.normalizeOptions(options)
    this.resolveEntries = this.resolveEntries.bind(this)
    this.resolveBasePath = this.resolveBasePath.bind(this)
  }

  apply (compiler) {
    this.compiler = compiler
    this.initialize()
  }

  initialize () {
    this.compiler.hooks.run.tapPromise(PLUGIN_NAME, this::this.hookRun)
    this.compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, this::this.hookRun)
    this.compiler.hooks.compilation.tap(PLUGIN_NAME, this::this.hookCompilation)
    this.compiler.hooks.thisCompilation.tap(PLUGIN_NAME, this::this.hookThisCompilation)
    this.compiler.hooks.afterEmit.tap(PLUGIN_NAME, this::this.hookAfterEmit)
  }

  async hookRun () {
    this.entryMap = getEntryMap(this)
    applySplitting(this, this.entryMap)
    return this.entryMap
  }

  hookCompilation (compilation) {
    applyChunkDecorations(this, compilation)
  }

  hookThisCompilation (compilation, compilationParams) {
    applyChunks(this, compilation)
    applyChunkAssets(this, compilation)
  }

  hookAfterEmit (compilation) {
    ensureRequire(this)
  }

  resolveEntries () {
    return this.entryResolver(this)
  }

  normalizeOptions (options = {}) {
    const defaultOptions = {
      basePath: resolve('src'),
      testAsset (filename) {
        return filename.match(/\.(jpe?g|png|svg|gif|woff2?|eot|ttf|otf|woff)(\?.*)?$/)
      },
      appConfig: 'app.config.js'
    }

    const ret = Object.assign({}, defaultOptions, options)

    Object.keys(ret).forEach(i => {
      this[i] = ret[i]
    })

    return ret
  }

  resolveBasePath (...args) {
    return path.join(this.basePath, ...args)
  }
}
