const path = require('path')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const PLUGIN_NAME = 'MinaWebpackPlugin'

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

// function addPageEntry ({ key, pagePath, compiler, basePath, fn }) {
//   const page = new PageConfig()
//   page.rawConfig = fn(page)
//   const entryInstance = new SingleEntryPlugin(
//     basePath,
//     `${resolve('./page-loader.js')}?${JSON.stringify({
//       config: page.json,
//       entry: page.entry,
//       key
//     })}!./${pagePath}/_.config.js`,
//     `pages/${key}`
//   )
//   entryInstance.apply(compiler)
//   return entryInstance
// }

class PageConfig {
  constructor (options) {
    this.options = options
    this.entry = './index.js'
    this.template = './index.wxml'
    this.style = './index.wxss'
    this.components = null
    this.env = null

    this.setEntry = this.setEntry.bind(this)
    this.setTemplate = this.setTemplate.bind(this)
    this.setStyle = this.setStyle.bind(this)
    this.injectEnv = this.injectEnv.bind(this)
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
  injectEnv () {}
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
    this.env = null
    this.basePath = options.basePath

    this.setEntry = this.setEntry.bind(this)
    this.setStyle = this.setStyle.bind(this)
    this.setRoute = this.setRoute.bind(this)
    this.useComponent = this.useComponent.bind(this)
    this.usePlugin = this.usePlugin.bind(this)
    this.setWorker = this.setWorker.bind(this)
    this.injectEnv = this.injectEnv.bind(this)
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
        // const basePath = path.join(this.basePath, subPackage, 'pages', key) + '/'
        const basePath = path.join(this.basePath, rawPath)
        const page = new PageConfig()
        page.rawConfig = require(
          path.join(this.basePath, `./${rawPath}/_.config.js`)
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
          }
        }
      })
  }
  useComponent () {}
  usePlugin () {}
  setWorker () {}
  injectEnv () {}

  getRouteConfig () {
    const packages = Object.keys(this.pageRoutes)
    const hasSubPackages = !!packages.filter(i => i != 'main').length
    
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
        })() : []
    }
  }

  get json () {
    return JSON.stringify({
      ...this.rawConfig,
      ...this.getRouteConfig()
    })
  }
}

// function getPageConfig (fn) {}
// function getComponentConfig (fn) {}

function getAppEntries (fn, compiler) {
  const app = new AppConfig({ compiler, basePath: this.basePath })
  app.rawConfig = fn(app)
  const packageNames = Object.keys(app.pageRoutes)
  const packages = {}
  for(const p of packageNames) {
    packages[p] = {
      ...(packages[p] || {}),
      pages: app.pageRoutes[p]
    }
  }
  return {
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
