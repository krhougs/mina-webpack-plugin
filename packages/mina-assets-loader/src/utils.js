import path from 'path'
import rfs from 'require-from-string'
import { transformSync } from '@babel/core'

function requireFromString (code) {
  const transformation = transformSync(code, {
    configFile: path.join(__dirname, '..', '.babelrc'),
    ast: false
  })
  return rfs(transformation.code).default
}

module.exports = {
  requireFromString,
  rfs
}
