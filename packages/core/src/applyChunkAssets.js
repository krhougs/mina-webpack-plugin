import { ConcatSource } from 'webpack-sources'

import { PLUGIN_NAME, LOADER_EXPORT_PREFIX } from './constants'

function applyChunkAssets (compilation) {
  compilation.hooks.optimizeChunkAssets.tapPromise(PLUGIN_NAME, async chunks => {
    for (const c of chunks) {
      for (const m of c.getModules()) {
        const content = m.originalSource()._value
        if (content.startsWith(LOADER_EXPORT_PREFIX)) {
          const config = JSON.parse(content.replace(LOADER_EXPORT_PREFIX, ''))
          if (config.options.template) {
            const key = c.id + '.wxml'
            compilation.assets[key] = compilation.assets[key]
              ? new ConcatSource(config.content, '\n', compilation.assets[key])
              : new ConcatSource(config.content)
          }

          if (config.options.stylesheets) {
          }

          if (config.options.assets) {
          }
        }
      }
    }
  })
}

export default function (plugin, ...args) {
  return plugin::applyChunkAssets(...args)
}
