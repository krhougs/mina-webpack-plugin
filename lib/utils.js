const path = require('path')

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

function normalizeOptions (options, thisArg) {
  const _options = options || {}
  const defaultOptions = {
    basePath: null,
    testAsset (filename) {
      return filename.match(/\.(jpe?g|png|svg|gif|woff2?|eot|ttf|otf|woff)(\?.*)?$/)
    }
  }

  const ret = Object.assign({}, defaultOptions, options)

  Object.getOwnPropertyNames(ret).forEach(i => {
    thisArg[i] = ret[i]
  })

  return ret
}

module.exports = {
  resolve,
  normalizeOptions
}
