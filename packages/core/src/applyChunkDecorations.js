import path from 'path'
import { ConcatSource } from 'webpack-sources'
import Template from 'webpack/lib/Template'

import {
  PLUGIN_NAME,
  WORKER_CHUNK_NAME
} from './constants'

function applyChunkDecorations (compilation) {
  const chunkNameRegex = /^(.+)\/(pages|components).+$/
  const windowRegExp = new RegExp('window', 'g')
  compilation.chunkTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
    return new ConcatSource(source.source().replace(windowRegExp, 'wx'))
  })
  compilation.mainTemplate.hooks.localVars.tap(PLUGIN_NAME, (source, chunk, hash) => {
    return Template.asString([
      source,
      '// The module cache',
      'wx.__webpack_installedModules = wx.__webpack_installedModules || {};',
      'var installedModules = wx.__webpack_installedModules;'
    ])
  })
  compilation.mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk) => {
    let groupName
    let injectContent = ''
    if (chunk.name === WORKER_CHUNK_NAME) {
      groupName = WORKER_CHUNK_NAME
    } else {
      groupName = chunk.name === 'app'
        ? 'main' : chunk.name.match(chunkNameRegex)[1]
      const relativePath = path.relative(
        path.dirname(path.resolve(this.basePath, chunk.name)),
        path.resolve(this.basePath, `${groupName}/include`)
      )
      const posixPath = relativePath.replace(/\\/g, '/')
      injectContent = `
          \n;(function () {
            if (!(wx.webpackJsonp && wx.webpackJsonp.length)) {
              ${
                ['common', 'vendor']
                  .map(i => `require('./${posixPath}.${i}.js')`)
                  .join(';')
              }
            }
          })()\n
      `
    }
    return new ConcatSource(source.source().replace(windowRegExp, 'wx'), injectContent)
  })
}

export default function (plugin, ...args) {
  return plugin::applyChunkDecorations(...args)
}
