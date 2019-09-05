import { ConcatSource } from 'webpack-sources'

import { PLUGIN_NAME, LOADER_EXPORT_PREFIX, WORKER_CHUNK_NAME, APP_CHUNK_NAME } from './constants'

import applyRemaxAssets from './remax/applyRemaxAssets'

async function applyNormalAssets (chunks, compilation) {
  for (const c of chunks) {
    for (const m of c.getModules()) {
      const content = m.originalSource()._value
      if (content.startsWith(LOADER_EXPORT_PREFIX)) {
        const config = JSON.parse(content.replace(LOADER_EXPORT_PREFIX, ''))

        if (config.options?.template) {
          const key = c.id + '.wxml'
          compilation.assets[key] = compilation.assets[key]
            ? new ConcatSource(compilation.assets[key], '\n', config.content)
            : new ConcatSource(config.content)
        }

        if (config.options?.stylesheets || config.__MINA?.options.stylesheets) {
          const key = c.id + '.wxss'
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

        if (config.options?.assets) {
        }
      }
    }
  }
}

function applyChunkAssets (compilation) {
  compilation.hooks.optimizeChunkAssets.tapPromise(PLUGIN_NAME, async chunks => {
    await this::applyNormalAssets(chunks, compilation)
    if (this.remax) {
      await this::applyRemaxAssets(chunks, compilation)
    }
  })
}

export default function (plugin, ...args) {
  return plugin::applyChunkAssets(...args)
}
