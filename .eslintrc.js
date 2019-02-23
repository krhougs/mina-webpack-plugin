
// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: 'standard',
  // check if imports actually resolve
  'settings': {
  },
  plugins: [
  ],
  // add your custom rules here
  'rules': {
    "arrow-parens": 0,
    "generator-star-spacing": 0,
    "space-before-function-paren": 0,
    // "prefer-bind-operator/prefer-bind-operator": 2,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 0 : 2
  },
  "globals": {
    "wxp": true,
    "wx": true,
    "getApp": true,
    "getCurrentPages": true,
    "App": true,
    "Page": true,
    "Component": true,
    "worker": true,
    "WX_WORKER_ENTRY_PATH": true
  }
}
