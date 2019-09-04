import path from 'path'
import fs from 'fs'

import { requireFromString } from './utils'

const {
  WORKER_DIRECTORY,
  COMPONENT_CONFIG_FILE_NAME
} = require('./constants')

function filterComponents (components) {
  const ret = {}
  for (const key in components) {
    ret[key] = {
      usePlugin: components[key].startsWith('plugin://'),
      request: components[key]
    }
  }
  return ret
}

class AppConfig {
  constructor (options) {
    this.options = options
    this.entry = './app.js'
    this.pageRoutes = {}
    this.components = {}
    this.worker = null
    this.usingPlugin = null
    this.env = {}
    this.basePath = options.basePath
    this.plugin = options.plugin

    this.setEntry = this.setEntry.bind(this)
    this.setRoute = this.setRoute.bind(this)
    this.useComponent = this.useComponent.bind(this)
    this.setWorker = this.setWorker.bind(this)
    this.define = this.define.bind(this)
  }

  setEntry (entry) {
    this.entry = entry
    return this
  }

  setStyle (request) {
    this.style = request
    return this
  }

  setRoute (...args) {
    const [subPackage, route, extra] = (function () {
      switch (typeof args[0]) {
        case 'string':
          return [args[0], args[1], args[2] || {}]
        case 'object':
          return ['main', args[0], args[1] || {}]
        default:
          throw new TypeError('Invalid route config.')
      }
    })()
    this.pageRoutes[subPackage] = Object.entries(route)
      .map(([key, query]) => this.plugin::getComponentEntries(
        key,
        query,
        subPackage,
        true
      ))
    this.pageRoutes[subPackage].extra = extra
    return this
  }

  useComponent (components) {
    Object.assign(this.components, filterComponents(this.components))
    return this
  }

  setWorker (request) {
    this.worker = request
    return this
  }

  define (data) {
    Object.assign(this.env, data)
    return this
  }

  getRouteConfig () {
    const packages = Object.keys(this.pageRoutes).filter(i => i !== 'main')
    const hasSubPackages = !!packages.length
    return {
      pages: [
        ...this.pageRoutes.main.map(i => `main/pages/${i.key}/${i.key}`)
      ],
      ...this.pageRoutes.main.extra,
      subPackages: hasSubPackages
        ? (() => {
          const ret = []
          for (const p of packages) {
            ret.push({
              root: p,
              name: p,
              pages: this.pageRoutes[p].map(i => `pages/${i.key}/${i.key}`)
              // ...extra
            })
          }
          return ret
        })() : []
    }
  }

  getWorkerConfig () {
    let ret
    if (this.worker) {
      ret.worker = WORKER_DIRECTORY
    }
    return ret
  }

  getComponentConfig () {
    return {
      usingComponents: {}
    }
  }

  toJSON () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getRouteConfig(),
      ...this.getWorkerConfig(),
      ...this.getComponentConfig()
    })
  }
}

class ComponentConfig {
  constructor (rawConfig = {}, isPage = true) {
    this.isPage = true
    this.rawConfig = rawConfig
  }

  toJSON (subPackage) {
    return JSON.stringify({
      ...this.rawConfig
    })
  }
}

function getComponentConfig (query) {
  const filenameRegex = /\.(\w+)$/
  const queryPath = this.resolveBasePath(query)

  try {
    const queryStats = fs.statSync(queryPath)
    if (queryStats.isDirectory()) {
      return path.join(queryPath, COMPONENT_CONFIG_FILE_NAME)
    }
    return queryPath.replace(filenameRegex, '') + '.config.js'
  } catch (error) {
    return queryPath.replace(filenameRegex, '') + '.config.js'
  }
}

function getComponentEntries (key, query, subPackage, isPage, parent) {
  isPage = !!isPage
  const distBasePath = `${subPackage}/${isPage ? 'pages' : 'components'}/${key}/${key}`
  const comp = new ComponentConfig(requireFromString(this::getComponentConfig(query)), isPage)
  return {
    isPage,
    query,
    key,
    config: comp,
    js: {
      request: query
    },
    json: comp.toJSON(subPackage),
    distBasePath
  }
}

function getEntryMap () {
  const app = new AppConfig({ plugin: this, basePath: this.basePath })
  app.rawConfig = requireFromString(this.resolveBasePath(this.appConfig))(app)

  const packageNames = Object.keys(app.pageRoutes)
  const packages = {}
  for (const p of packageNames) {
    packages[p] = {
      ...(packages[p] || {}),
      pages: app.pageRoutes[p]
    }
  }

  return {
    worker: app.worker
      ? {
        basePath: this.basePath,
        request: app.worker
      }
      : null,
    app: {
      js: {
        request: app.entry
      },
      json: app.toJSON()
    },
    ...packages,
    packageNames
  }
}

export default function (plugin) {
  return plugin::getEntryMap()
}
