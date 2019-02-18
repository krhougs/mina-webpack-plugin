const path = require('path')
const DefinePlugin = require('webpack/lib/DefinePlugin')

const {
  CONFIG_FILE_NAME,
  PLUGIN_NAME,
  WORKER_CHUNK_NAME,
  WORKER_DIRECTORY
} = require('./const')

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

function getComponentConfig (subPackageName, rawConfig) {
  const ret = {}
  for (const key of rawConfig) {
    if (rawConfig.startsWith('plugin://')) {
      ret[key] = {
        usePlugin: true,
        request: rawConfig
      }
    } else {
      ret[key] = {
        usePlugin: false,
        request: resolveComponent.bind(this)()
      }
    }
  }
  return ret
}

function resolveComponent (subPackageName, request) {

}

class ComponentConfig {
  constructor (options) {
    this.options = options
    this.entry = './index.js'
    this.template = './index.wxml'
    this.style = './index.wxss'
    this.components = {}
    this._components = {}

    this.setEntry = this.setEntry.bind(this)
    this.setTemplate = this.setTemplate.bind(this)
    this.setStyle = this.setStyle.bind(this)
    this.useComponent = this.useComponent.bind(this)
  }
  setEntry (request) {
    this.entry = request
  }
  setTemplate (request) {
    this.template = request
  }
  setStyle (request) {
    this.style = request
  }
  useComponent (components) {
    Object.assign(this.components, components)
  }

  getComponentConfig () {}

  get json () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getComponentConfig()
    })
  }
}

class AppConfig {
  constructor (options) {
    this.options = options
    this.entry = './app.js'
    this.pageRoutes = {}
    this.style = null
    this.components = {}
    this.worker = null
    this.usingPlugin = null
    this.env = {}
    this.basePath = options.basePath

    this.setEntry = this.setEntry.bind(this)
    this.setStyle = this.setStyle.bind(this)
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
      .map(({0: key, 1: rawPath}) => {
        const basePath = path.join(this.basePath, rawPath)
        const page = new ComponentConfig()
        page.rawConfig = require(
          path.join(this.basePath, `./${rawPath}/${CONFIG_FILE_NAME}`)
        )(page)
        return {
          appBasePath: this.basePath,
          basePath,
          rawPath,
          key,
          js: {
            request: './' + path.relative(basePath, path.join(this.basePath, rawPath, page.entry))
          },
          json: page.json,
          style: {
            request: page.style
          },
          template: {
            request: page.template
          },
          distBasePath: `${subPackage}/pages/${key}/${key}`
        }
      })
    this.pageRoutes[subPackage].extra = extra
    return this
  }
  useComponent (components) {
    Object.assign(this.components, getComponentConfig.bind(this)('main', this.components))
    return this
  }
  setWorker (request) {
    this.worker = request
  }
  define (data) {
    Object.assign(this.env, data)
  }

  getRouteConfig () {
    const packages = Object.keys(this.pageRoutes).filter(i => i !== 'main')
    const hasSubPackages = !!packages.length
    
    return {
      pages: [
        ...this.pageRoutes['main'].map(i => `main/pages/${i.key}/${i.key}`)
      ],
      ...this.pageRoutes['main'].extra,
      subPackages: hasSubPackages
        ? (() => {
          const ret = []
          for (const p of packages) {
            ret.push({
              root: p,
              name: p,
              pages: this.pageRoutes[p].map(i => `pages/${i.key}/${i.key}`),
              ...extra
            })
          }
          return ret
        })() : []
    }
  }

  getWorkerConfig () {
    const ret = {}
    if (this.worker) {
      ret['workers'] = WORKER_DIRECTORY
    }
    return ret
  }

  getComponentConfig () {
    return {
      usingComponents: {}
    }
  }

  get json () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getRouteConfig(),
      ...this.getWorkerConfig(),
      ...this.getComponentConfig()
    })
  }
}

function getAppEntries (fn, compiler) {
  const app = new AppConfig({ compiler, basePath: this.basePath })
  app.rawConfig = fn(app)

  new DefinePlugin(
    (() => {
      const ret = {}
      for (const envKey in app.env) {
        ret[envKey] = JSON.stringify(app.env[envKey])
      }
      return ret
    })()
  ).apply(compiler)

  const packageNames = Object.keys(app.pageRoutes)
  const packages = {}
  for(const p of packageNames) {
    packages[p] = {
      ...(packages[p] || {}),
      pages: app.pageRoutes[p]
    }
  }

  const workerBasePath = `${this.basePath}/${WORKER_CHUNK_NAME}`

  return {
    worker: app.worker
      ? {
        basePath: this.basePath,
        request: app.worker
      }
      : null,
    app: {
      basePath: `${this.basePath}/`,
      js: {
        request: app.entry
      },
      json: app.json,
      style: {
        request: app.style
      }
    },
    ...packages,
    packageNames
  }
}

module.exports = {
  getAppEntries
}
