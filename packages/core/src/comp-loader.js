const path = require('path')
const { getOptions } = require('loader-utils')

const pageTemplate = function (entry) {
  return `\
    import page from '${entry}'
    if (page.isNoseaPage) {
      Page(page.builder)
    } else {
      Page(page)
    }
  `
}

const componentTemplate = function (entry) {
  return `\
    import comp from '${entry}'
    if (comp.isNoseaPage) {
      Component(comp.componentBuilder)
    } else {
      Component(comp)
    }
  `
}

function ComponentLoader (content, map, meta) {
  const callback = this.async()
  const { page } = getOptions(this)
  callback(
    null,
    (page ? pageTemplate : componentTemplate)('./' + path.relative(this.context, this.resourcePath)),
    map,
    meta
  )
}

module.exports = ComponentLoader
