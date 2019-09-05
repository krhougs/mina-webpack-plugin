module.exports = {
  PLUGIN_NAME: 'MinaWebpackPlugin',

  APP_CONFIG_FILE_NAME: 'app.config.js',
  COMPONENT_CONFIG_FILE_NAME: 'index.config.js',

  WORKER_DIRECTORY: '~worker',
  WORKER_ENTRY: '~worker/index.js',
  WORKER_CHUNK_NAME: '~worker/index',

  APP_CHUNK_NAME: 'app',

  LOADER_EXPORT_PREFIX: "'use mina'"
}
