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

class PageConfig {
  constructor (options) {
    this.options = options
    this.entry = './index.js'
    this.template = './index.wxml'
    this.style = './index.wxss'
    this.components = null

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
  useComponent () {}

  get json () {
    return JSON.stringify({
      ...this.rawConfig
    })
  }
}

class AppConfig {
  constructor (options) {
    this.options = options
    this.entry = './app.js'
    this.pageRoutes = {}
    this.style = null
    this.components = null
    this.worker = null
    this.usingPlugin = null
    this.env = {}
    this.basePath = options.basePath

    this.setEntry = this.setEntry.bind(this)
    this.setStyle = this.setStyle.bind(this)
    this.setRoute = this.setRoute.bind(this)
    this.useComponent = this.useComponent.bind(this)
    this.usePlugin = this.usePlugin.bind(this)
    this.setWorker = this.setWorker.bind(this)
    this.define = this.define.bind(this)
  }
  
  setEntry (entry) {
    this.entry = entry
  }

  setStyle (request) {
    this.style = request
  }

  setRoute (...args) {
    const [subPackage, route] = (function () {
      switch (typeof args[0]) {
        case 'string':
          return [args[0], args[1]]
        case 'object':
          return ['main', args[0]]
        default:
          throw new TypeError('Invalid route config.')
      }
    })()
    this.pageRoutes[subPackage] = Object.entries(route)
      .map(({0: key, 1: rawPath}) => {
        const basePath = path.join(this.basePath, rawPath)
        const page = new PageConfig()
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
  }
  useComponent () {}
  usePlugin () {}
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
      subPackages: hasSubPackages
        ? (() => {
          const ret = []
          for (const p of packages) {
            ret.push({
              root: p,
              name: p,
              pages: this.pageRoutes[p].map(i => `pages/${i.key}/${i.key}`)
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

  get json () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getRouteConfig(),
      ...this.getWorkerConfig()
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
