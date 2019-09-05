import fs from 'fs'
import { Parser } from 'acorn'
import { PLUGIN_NAME } from '../constants'

import BabelRemaxPagePlugin from './BabelRemaxPagePlugin'

const JSXParser = Parser.extend(
  require('acorn-jsx')()
)

function isRemaxRequest (data) {
  if (data.resource) {
    const code = String(fs.readFileSync(data.resource))
    const ast = JSXParser.parse(code, {
      ecmaVersion: 6,
      sourceType: 'module'
    })
    return ast.body.every(node => !(
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'Identifier' &&
      node.expression.callee.name === 'Page' &&
      node.expression.arguments.length > 0 &&
      node.expression.arguments[0].type === 'ObjectExpression'
    ))
  }
  return false
}

async function hookBeforeResolve (data) {
  if (data.rawRequest?.endsWith('?remaxPage')) {
    ['rawRequest', 'request', 'resource', 'userRequest'].forEach(k => {
      data[k] = data[k].replace(/\?remaxPage$/, '')
    })
    data.isRemaxPage = isRemaxRequest(data)
  }
}

async function hookAfterResolve (data) {
  if (data.isRemaxPage) {
    data.loaders.unshift({
      loader: require.resolve('babel-loader'),
      __remax: true,
      options: {
        plugins: [BabelRemaxPagePlugin]
      }
    })
  }
}

export default function (normalModuleFactory) {
  normalModuleFactory.hooks.afterResolve.tapPromise(PLUGIN_NAME, this::hookBeforeResolve)
  normalModuleFactory.hooks.afterResolve.tapPromise(PLUGIN_NAME, this::hookAfterResolve)
}
