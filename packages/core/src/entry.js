const path = require('path')
const DefinePlugin = require('webpack/lib/DefinePlugin')

const {
  CONFIG_FILE_NAME,
  WORKER_DIRECTORY
} = require('./const')

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

class ComponentConfig {
  constructor (isPage, options) {
    this.options = options || {}
    this.isPage = !!isPage
    this.distBasePath = options.distBasePath
    this.subPackage = options.subPackage
    this.basePath = options.basePath
    this.request = options.request
    this.context = options.context || this.basePath
    this.parent = options.parent
    this.childrenPath = path.join(
      this.parent ? this.parent.childrenPath : '.',
      this.request
    )
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
    return this
  }
  setTemplate (request) {
    this.template = request
    return this
  }
  setStyle (request) {
    this.style = request
    return this
  }
  useComponent (components) {
    const ret = {}
    components = filterComponents(components)
    for (const key in components) {
      ret[key] = components[key].usePlugin
        ? components[key].request
        : getComponentEntries(
          key,
          components[key].request,
          this.subPackage,
          this.basePath,
          false,
          this)
    }
    Object.assign(this.components, ret)
    return this
  }

  getComponentConfig () {
    const usingComponents = {}
    for (const key in this.components) {
      if (typeof this.components[key] === 'object') {
        usingComponents[key] = path.relative(
          path.dirname(this.distBasePath),
          this.components[key].distBasePath
        )
      } else {
        usingComponents[key] = this.components[key]
      }
    }
    return { usingComponents }
  }

  toJSON (subPackage) {
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
      .map(({ 0: key, 1: rawPath }) => getComponentEntries(
        key,
        rawPath,
        subPackage,
        this.basePath,
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
              pages: this.pageRoutes[p].map(i => `pages/${i.key}/${i.key}`)
              // ...extra
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

  toJSON () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getRouteConfig(),
      ...this.getWorkerConfig(),
      ...this.getComponentConfig()
    })
  }
}

function getComponentEntries (key, rawPath, subPackage, appBasePath, isPage, parent) {
  isPage = !!isPage
  const basePath = path.join(
    appBasePath,
    parent ? parent.childrenPath : '.',
    rawPath)
  const distBasePath = `${subPackage}/${isPage ? 'pages' : 'components'}/${key}/${key}`
  const comp = new ComponentConfig(isPage, {
    basePath: appBasePath,
    subPackage,
    request: rawPath,
    parent,
    distBasePath,
    context: parent ? parent.context : appBasePath
  })
  comp.rawConfig = require(`${basePath}/${CONFIG_FILE_NAME}`)(comp)
  return {
    isPage,
    appBasePath,
    basePath,
    rawPath,
    key,
    config: comp,
    js: {
      // request: './' + path.relative(basePath, path.join(appBasePath, rawPath, comp.entry)),
      request: './' + path.relative(
        basePath,
        path.join(basePath, comp.entry)
      )
    },
    json: comp.toJSON(subPackage),
    style: {
      request: comp.style
    },
    template: {
      request: comp.template
    },
    components: comp.components,
    distBasePath
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
      basePath: `${this.basePath}/`,
      js: {
        request: app.entry
      },
      json: app.toJSON(),
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
