import path from 'path'
import { resolve } from './utils'

import { PLUGIN_NAME } from './constants'

import getEntryMap from './getEntryMap'
import applySplitting from './applySplitting'
import applyChunks from './applyChunks'
import applyChunkDecorations from './applyChunkDecorations'
import applyChunkAssets from './applyChunkAssets'
import ensureRequire from './ensureRequire'
import applyStaticAssetDecoration from './applyStaticAssetDecoration'

import BabelRemaxComponentPlugin from './remax/BabelRemaxComponentPlugin'
import * as RemaxWechatAdapter from './remax/adapter/wechat'
import applyEntryDecoration from './remax/applyEntryDecoration'

export default class MinaWebpackPlugin {
  constructor (options) {
    this.normalizeOptions(options)
    this.resolveEntries = this.resolveEntries.bind(this)
    this.resolveBasePath = this.resolveBasePath.bind(this)
    global.__minaWebpackPlugin = this
  }

  apply (compiler) {
    this.compiler = compiler
    this.initialize()
  }

  initialize () {
    this.compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, this::this.hookNormalModuleFactory)
    this.compiler.hooks.run.tapPromise(PLUGIN_NAME, this::this.hookRun)
    this.compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, this::this.hookRun)
    this.compiler.hooks.compilation.tap(PLUGIN_NAME, this::this.hookCompilation)
    this.compiler.hooks.thisCompilation.tap(PLUGIN_NAME, this::this.hookThisCompilation)
    this.compiler.hooks.afterEmit.tap(PLUGIN_NAME, this::this.hookAfterEmit)
  }

  hookNormalModuleFactory (normalModuleFactory) {
    this::applyStaticAssetDecoration(normalModuleFactory)
    if (this.remax) {
      return this::applyEntryDecoration(normalModuleFactory)
    }
  }

  async hookRun () {
    this.entryMap = getEntryMap(this)
    this.staticAssets = []
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

  BabelRemaxComponentPlugin = BabelRemaxComponentPlugin(RemaxWechatAdapter)

  normalizeOptions (options = {}) {
    const defaultOptions = {
      basePath: resolve('src'),
      appConfig: 'app.config.js',
      remax: false
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
