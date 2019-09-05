import * as t from '@babel/types'
import { get } from 'dot-prop'
import { kebabCase } from 'lodash'

let components = {}

function shouldRegisterAllProps(adapter, node, componentName) {
  if (node.openingElement.attributes.find(a => a.type === 'JSXSpreadAttribute')) {
    return true
  }
  return false
}

export default (adapter) => () => {
  return ({
    visitor: {
      JSXElement(path) {
        const node = path.node
        if (t.isJSXIdentifier(node.openingElement.name)) {
          const tagName = node.openingElement.name.name
          const binding = path.scope.getBinding(tagName)
          if (!binding) {
            return
          }
          const componentPath = get(binding, 'path')
          if (!componentPath ||
                      !t.isImportSpecifier(componentPath.node) ||
                      !t.isImportDeclaration(componentPath.parent) ||
                      !componentPath.parent.source.value.startsWith('remax/')) {
            return
          }
          const componentName = componentPath.node.imported.name
          const id = kebabCase(componentName)
          if (id === 'swiper-item') {
            return
          }

          let usedProps = adapter.hostComponents(id).props
          if (!shouldRegisterAllProps(adapter, node, componentName)) {
            usedProps = node.openingElement.attributes.map(e => {
              const propName = get(e, 'name.name')
              return propName
            })
          }
          const props = usedProps
            .filter(prop => !!prop)
            .map(prop => adapter.getNativePropName(prop))
          if (!components[id]) {
            components[id] = {
              type: kebabCase(componentName),
              id,
              props
            }
          }
          props.forEach(prop => {
            if (components[id].props.findIndex(item => item === prop) !== -1) {
              return
            }
            components[id].props.push(prop)
          })
        }
      }
    }
  })
}

export function resetComponents () {
  components = {}
}

export function getComponents() {
  return Object.values(components)
}
