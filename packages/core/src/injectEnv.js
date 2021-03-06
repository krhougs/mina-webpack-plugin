const fs = require('fs')
const path = require('path')
const DefinePlugin = require('webpack/lib/DefinePlugin')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

const dotEnvPath = resolveApp('.env')

const NODE_ENV = process.env.NODE_ENV || 'development'

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${dotEnvPath}.${NODE_ENV}.local`,
  `${dotEnvPath}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${dotEnvPath}.local`,
  dotEnvPath
].filter(Boolean)

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile
      })
    )
  }
})

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebook/create-react-app/issues/253.
// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of Webpack shims.
// https://github.com/facebook/create-react-app/issues/1023#issuecomment-265344421
// We also resolve them to make sure all tools using them work consistently.
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter)

// Grab NODE_ENV and MINA_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const MINA_APP = /^MINA_APP_/i

function getClientEnvironment (data) {
  const raw = Object.keys(process.env)
    .filter(key => MINA_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key]
        return env
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || 'development',
        ...(data || {})
      }
    )
  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = JSON.stringify(raw)

  return { raw, stringified }
}

function injectEnv () {
  const routes = (() => {
    const ret = {}
    this.entryMap.packageNames
      .forEach(packageName => {
        ret[packageName] = {}
        this.entryMap[packageName].pages.forEach(page => {
          ret[packageName][page.key] = `/${page.distBasePath}`
        })
      })
    return ret
  })()
  new DefinePlugin({
    'process.env': getClientEnvironment({
      APP_ROUTES: routes
    }).stringified
  }).apply(this.compiler)
}

export default function (plugin, ...args) {
  return plugin::injectEnv(...args)
}
