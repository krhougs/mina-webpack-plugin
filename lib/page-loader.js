const path = require('path')
const { getOptions } = require('loader-utils')
// const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')

// const appTemplate = function ({ entry }) {
//   return `\
//     import app from '${entry}'
//     App(app)
//   `
// }

const pageTemplate = function (entry) {
  return `\
    import page from '${entry}'
    Page(page)
  `
}

function PageLoader (content, map, meta) {
  const callback = this.async()
  // const {
  //   config,
  //   entry,
  //   key
  // } = getOptions(this)
  callback(
    null,
    pageTemplate('./' + path.relative(this.context, this.resourcePath)),
    map,
    meta
  )
}

module.exports = PageLoader
