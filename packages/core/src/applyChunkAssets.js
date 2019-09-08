import { ConcatSource } from 'webpack-sources'
import rfs from 'require-from-string'

import { PLUGIN_NAME, LOADER_EXPORT_PREFIX } from './constants'

import applyRemaxAssets from './remax/applyRemaxAssets'

async function applyNormalAssets (chunks, compilation) {
  for (const c of chunks) {
    for (const m of c.getModules()) {
      if (m._source) {
        const content = m._source._value
        if (content.startsWith(LOADER_EXPORT_PREFIX)) {
          const config = rfs(content)

          if (config.options?.template) {
            const key = c.name + '.wxml'
            compilation.assets[key] = compilation.assets[key]
              ? new ConcatSource(compilation.assets[key], '\n', config.content)
              : new ConcatSource(config.content)
          } else if (config.options?.stylesheets || config.__MINA?.options.stylesheets) {
            const key = 'app.wxss'
            if (config.__MINA?.options.cssModules) {
              compilation.assets[key] = compilation.assets[key]
                ? new ConcatSource(compilation.assets[key], '\n', config.__MINA.stylesheets)
                : new ConcatSource(config.__MINA.stylesheets)
            } else {
              compilation.assets[key] = compilation.assets[key]
                ? new ConcatSource(compilation.assets[key], '\n', config.content)
                : new ConcatSource(config.content)
            }
          }
        }
      }
    }
  }
}

function applyChunkAssets (compilation) {
  compilation.hooks.optimizeChunkAssets.tapPromise(PLUGIN_NAME, chunks => {
    const promises = [
      this::applyNormalAssets(chunks, compilation)
    ]
    if (this.remax) {
      promises.push(this::applyRemaxAssets(chunks, compilation))
    }
    return Promise.all(promises)
  })
}

export default function (plugin, ...args) {
  return plugin::applyChunkAssets(...args)
}
