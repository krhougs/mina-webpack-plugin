const path = require('path')
const { getOptions } = require('loader-utils')
// const CommonJsRequireDependency = require("webpack/lib/dependencies/CommonJsRequireDependency")

const PLUGIN_NAME = 'MinaWebpackPlugin'

const appTemplate = function (entry) {
  return `\
    import app from '${entry}'
    if (app.isNoseaApp) {
      App(
        (new app()).getInitOptions()
      )
    } else {
      App(app)
    }
  `
}

function AppLoader (content, map, meta) {
  const callback = this.async()
  const options = getOptions(this)
  callback(
    null,
    appTemplate('./' + path.relative(this.context, this.resourcePath)),
    map,
    meta
  )
}

module.exports = AppLoader
