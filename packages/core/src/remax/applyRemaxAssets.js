import path from 'path'
import { renderFile } from 'ejs'
import { ConcatSource } from 'webpack-sources'

import { getComponents } from './BabelRemaxComponentPlugin'
import * as adapter from './adapter/wechat'

async function applyBaseTemplate (chunks, compilation) {
  const components = getComponents()
  const code = await renderFile(adapter.templates.base, {
    components,
    depth: 20
  })

  for (const n of this.entryMap.packageNames) {
    compilation.assets[path.join(n, `base${adapter.extensions.template}`)] = new ConcatSource(code)
  }
}

async function applyHelperFile (chunks, compilation) {
  const code = await renderFile(adapter.templates.jsHelper, {
    target: adapter.name
  })

  for (const n of this.entryMap.packageNames) {
    compilation.assets[path.join(n, `helper${adapter.extensions.jsHelper}`)] = new ConcatSource(code)
  }
}

async function applyEntryTemplates (chunks, compilation) {
  return Promise.all(
    chunks.map(c => (
      async () => {
        if (!this::isRemaxChunk(c)) { return }

        const templateCode = await renderFile(adapter.templates.page, {
          baseTemplate: `../../base${adapter.extensions.template}`,
          jsHelper: `../../helper${adapter.extensions.jsHelper}`
        })

        compilation.assets[`${c.id}${adapter.extensions.template}`] = new ConcatSource(templateCode)
      }
    )())
  )
}

function isRemaxChunk (chunk) {
  if (chunk.id.indexOf('/pages/') > -1) {
    const module = chunk.entryModule
    return !!module.loaders?.[0]?.__remax
  }
  return false
}

function applyRemaxAssets (chunks, compilation) {
  return Promise.all([
    this::applyBaseTemplate(chunks, compilation),
    this::applyHelperFile(chunks, compilation),
    this::applyEntryTemplates(chunks, compilation)
  ])
}

export default applyRemaxAssets
