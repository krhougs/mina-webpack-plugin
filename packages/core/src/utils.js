import path from 'path'
import rfs from 'require-from-string'
import { transformFileSync } from '@babel/core'

function resolve (...dir) {
  return path.join(process.cwd(), '.', ...dir)
}

function resolveInside (...dir) {
  return path.join(__dirname, '.', ...dir)
}

function requireFromString (filename) {
  const transformation = transformFileSync(filename, {
    configFile: path.join(__dirname, '..', '.babelrc.js'),
    ast: false
  })
  return rfs(transformation.code).default
}

module.exports = {
  resolve,
  resolveInside,
  requireFromString
}
