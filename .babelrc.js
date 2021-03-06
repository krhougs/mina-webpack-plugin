module.exports = {
  "presets": [
    ["@babel/preset-env"]
  ],
  "plugins": [
    ["@babel/plugin-transform-modules-commonjs"],
    ["@babel/plugin-transform-for-of"],
    ["@babel/plugin-transform-runtime", {
      "helpers": false,
      "regenerator": true
    }],
    ["@babel/plugin-transform-destructuring"],
    ["@babel/plugin-proposal-object-rest-spread"],
    ["@babel/plugin-proposal-class-properties", {
      "loose": true
    }],
    ["@babel/plugin-transform-block-scoping"],
    ["@babel/plugin-proposal-function-bind"],
    ["@babel/plugin-proposal-optional-chaining"],
    ["@babel/plugin-syntax-jsx"]
  ],
  "sourceMaps": "inline"
}
