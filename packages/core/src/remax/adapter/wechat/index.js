import path from 'path'

export const name = 'wechat'

export function hostComponents(component) {
  return require(`./hostComponents/${component}`)
}

export const extensions = {
  template: '.wxml',
  style: '.wxss',
  jsHelper: '.wxs'
}

const templateBaseDir = path.join(__dirname, '../../../../templates')

export const templates = {
  base: path.join(templateBaseDir, 'base.ejs'),
  component: path.join(templateBaseDir, 'component.ejs'),
  page: path.join(templateBaseDir, 'page.ejs'),
  jsHelper: path.join(templateBaseDir, 'helper.js')
}

export const moduleFormat = 'cjs'

// TODO: alias 方法在 remax 和 remax-cli 都重复定义了，想办法 DRY
const alias = {
  className: 'class',
  activeColor: 'activeColor',
  backgroundColor: 'backgroundColor',
  onClick: 'bindtap'
}

export function getNativePropName(prop) {
  const aliasProp = alias[prop]

  if (aliasProp) {
    return aliasProp
  }

  if (prop.startsWith('on')) {
    return prop.toLowerCase().replace('on', 'bind')
  }

  return prop
}
