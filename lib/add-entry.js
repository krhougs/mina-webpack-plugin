const DefinePlugin = require('webpack/lib/DefinePlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')

const getEnv = require('./env')
const { resolve } = require('./utils')

const {
  WORKER_CHUNK_NAME
} = require('./const')

function injectRouteEnv () {
  new DefinePlugin(
    getEnv({
      APP_ROUTES: (() => {
        const ret = {}
        Object.entries(this.packageEntries)
          .forEach(({ 0: k, 1: v }) => {
            ret[k] = {}
            v.forEach(i => {
              ret[k][i.key] = '/' + i.distBasePath
            })
          })
        return ret
      })(),
      APP_ROUTES_DETAIL: this.packageEntries
    }).stringified
  ).apply(this.compiler)
}

function addWorkerEntry () {
  new SingleEntryPlugin(
    this.workerEntry.basePath,
    this.workerEntry.request,
    WORKER_CHUNK_NAME
  ).apply(this.compiler)
}

function addAppEntry (compilation) {
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
}

function addPageEntries (compilation) {
  for (const packageName of this.packageNames) {
    const components = {}
    for (const page of this.packageEntries[packageName]) {
      addComponentEntry.call(this, page, compilation, this.compiler)
      resolveComponents(components, page)
    }
    for (const component in components) {
      addComponentEntry.call(this, components[component], compilation, this.compiler)
    }
  }
}

function resolveComponents (obj, page) {
  const keys = Object.getOwnPropertyNames(page.components)
  for (const key of keys) {
    if (!obj[key]) {
      obj[key] = page.components[key]
      resolveComponents(obj, page.components[key])
    }
  }
}

function addComponentEntry (config, compilation, compiler) {
  const fileName = config.distBasePath
  new MultiEntryPlugin(
    config.basePath,
    [
      `${resolve('./comp-loader.js')}?page=${config.isPage}!${config.js.request}`,
      `file-loader?name=${fileName}.wxml!${config.template.request}`,
      config.style.request && `file-loader?name=${fileName}.wxss!${config.style.request}`
    ].filter(i => i),
    fileName
  ).apply(compiler)
  compilation.assets[`${fileName}.json`] = {
    source: () => config.json,
    size: () => config.json.length
  }
}

module.exports = {
  injectRouteEnv,
  addWorkerEntry,
  addAppEntry,
  addPageEntries,
  addComponentEntry
}
