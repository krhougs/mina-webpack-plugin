import * as t from '@babel/types'
import { addNamed } from '@babel/helper-module-imports'

function appConfigExpression(path, id) {
  const createId = addNamed(path, 'createAppConfig', 'remax')
  path.insertAfter(
    t.exportDefaultDeclaration(
      t.callExpression(
        t.identifier('App'), [t.callExpression(createId, [id])])))
}

export default () => ({
  visitor: {
    ExportDefaultDeclaration: (path) => {
      if (t.isExpression(path.node.declaration)) {
        const appId = path.scope.generateUidIdentifier('app')
        const declaration = path.node.declaration
        path.replaceWith(t.variableDeclaration('const', [
          t.variableDeclarator(appId, declaration)
        ]))
        appConfigExpression(path, appId)
        path.stop()
      } else if (t.isFunctionDeclaration(path.node.declaration) ||
            t.isClassDeclaration(path.node.declaration)) {
        const declaration = path.node.declaration
        const appId = path.scope.generateUidIdentifierBasedOnNode(path.node)
        declaration.id = appId
        path.replaceWith(declaration)
        appConfigExpression(path, appId)
        path.stop()
      }
    },
    Identifier: (path) => {
      // 防止跟小程序的  App 冲突
      if (path.node.name === 'App') {
        path.scope.rename('App', path.scope.generateUidIdentifier('App').name)
      }
    }
  }
})
