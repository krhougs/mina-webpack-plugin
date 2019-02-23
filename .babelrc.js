var plugins = [
  ["@babel/plugin-transform-for-of"],
  ["@babel/plugin-transform-runtime", {
    "helpers": false,
    "regenerator": true
  }],
  ["@babel/plugin-transform-regenerator"],
  ["@babel/plugin-transform-destructuring"],
  ["@babel/plugin-proposal-object-rest-spread"],
  ["@babel/plugin-proposal-decorators", {
    legacy: true
  }],
  ["@babel/plugin-proposal-class-properties", {
    loose: true
  }],
  ["@babel/plugin-transform-block-scoping"],
  ["@babel/plugin-proposal-function-bind"]
]
if (process.env.NO_CONSOLE === 'true') {
  plugins.push([
    "transform-remove-console", {
      "exclude": ["error"]
    }])
}

module.exports = {
  "plugins": plugins,
  "sourceMaps": 'inline'
}
