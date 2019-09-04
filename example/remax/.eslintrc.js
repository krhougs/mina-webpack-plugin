module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: [
    'standard',
    'plugin:react/recommended'
  ],
  // check if imports actually resolve
  settings: {
    react: {
      version: "16.9"
    }
  },
  plugins: [
    'react'
  ],
  // add your custom rules here
  'rules': {
    "arrow-parens": 0,
    "generator-star-spacing": 0,
    "space-before-function-paren": 0,
    'react/prop-types': 0
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
    "WX_WORKER_ENTRY_PATH": true,
    "e": true,
    "t": true
  }
}
