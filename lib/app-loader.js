const path = require('path')

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
  callback(
    null,
    appTemplate('./' + path.relative(this.context, this.resourcePath)),
    map,
    meta
  )
}

module.exports = AppLoader
