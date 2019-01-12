const path = require('path')
const { getOptions } = require('loader-utils')
// const CommonJsRequireDependency = require("webpack/lib/dependencies/CommonJsRequireDependency")

const PLUGIN_NAME = 'MinaWebpackPlugin'

const appTemplate = function (entry) {
  return `\
    import app from '${entry}'
    App(app)
  `
}

const styleTemplate = function (entry) {
  return `\
    @import '${entry}'
  `
}

function AppLoader (content, map, meta) {
  const callback = this.async()
  const options = getOptions(this)
  // if (options.style) {
  //   this._compilation.hooks.succeedModule.tap(PLUGIN_NAME, module => {
  //     module.dependencies.push(new CommonJsRequireDependency(options.style, null))
  //   })
  // }
  callback(
    null,
    options && options.style
      ? styleTemplate('./' + path.relative(this.context, this.resourcePath))
      : appTemplate('./' + path.relative(this.context, this.resourcePath)),
    map,
    meta
  )
}

module.exports = AppLoader
