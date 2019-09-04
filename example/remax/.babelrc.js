const presets = [
  ['@babel/preset-env'], ["@babel/preset-react"],
]

const plugins = [
  ["@babel/plugin-transform-for-of"],
  ["@babel/plugin-transform-regenerator"],
  ["@babel/plugin-transform-runtime", {
    "helpers": false,
    "regenerator": true,
    "absoluteRuntime": true,
    "loose": true
  }],
  ["@babel/plugin-transform-destructuring"],
  ["@babel/plugin-proposal-object-rest-spread"],
  ["@babel/plugin-proposal-class-properties", {
    loose: true
  }],
  ["@babel/plugin-transform-block-scoping"],
  ["@babel/plugin-proposal-function-bind"],
  ["@babel/plugin-proposal-optional-chaining"],
  ['@babel/plugin-syntax-jsx']
]
if (process.env.NO_CONSOLE === 'true') {
  plugins.push([
    "transform-remove-console", {
      "exclude": ["error"]
    }])
}

module.exports = {
  "presets": presets,
  "plugins": plugins,
  "sourceMaps": 'inline'
}
