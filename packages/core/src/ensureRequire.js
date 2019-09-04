import fs from 'fs'
import path from 'path'

function ensureRequire () {
  const outputPath = this.compiler.options.output.path
  for (const n of this.entryMap.packageNames) {
    ['common', 'vendor'].forEach(i => {
      const filename = path.resolve(outputPath, n, `./include.${i}.js`)
      const exists = fs.existsSync(filename)

      if (!exists) {
        fs.writeFileSync(filename, '')
      }
    })
  }
  this.entryMap = undefined
}

export default function (plugin, ...args) {
  return plugin::ensureRequire(...args)
}
