import { PLUGIN_NAME } from './constants'

// Webpack would merge request by default, for which `mina-asset-loader` would only run ran once.
// The default behavior results in that the path of imported assets be wrong in different context.
// This hook is a hack for this.

const assetLoaderName = 'mina-assets-loader'

async function hookAfterResolve (data) {
  const assetLoaderPos = data.loaders
    .findIndex(i => i.loader.indexOf(assetLoaderName) > -1)
  const assetLoaderOptions = data.loaders[assetLoaderPos]?.options
  if (assetLoaderPos > -1 &&
    !assetLoaderOptions?.template &&
    !assetLoaderOptions?.stylesheets) {
    data.request += `?${Math.random() * 1000000}`
  }
}

export default function (normalModuleFactory) {
  normalModuleFactory.hooks.afterResolve.tapPromise(PLUGIN_NAME, this::hookAfterResolve)
}
