const path = require('path')
// const webpack = require('webpack')

const rem2rpx = require('@krhougs/postcss-rem2rpx')
const poststylus = require('poststylus')

const MinaWebpackPlugin = require('../../../packages/core').default
// const CopyPlugin = require('copy-webpack-plugin')

const minaWebpackPlugin = new MinaWebpackPlugin({
  remax: true
})

let babelConfig = require('../.babelrc')
babelConfig = {
  ...babelConfig,
  plugins: [
    minaWebpackPlugin.BabelRemaxComponentPlugin,
    ...babelConfig.plugins
  ]
}

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  mode: 'development',
  optimization: {},
  entry: () => ({}),
  plugins: [
    minaWebpackPlugin
  //   new CopyPlugin([
  //     {
  //       from: 'static',
  //       to: '.',
  //       toType: 'dir'
  //     }
  //   ])
  ].filter(function (e) { return e }),
  devtool: false,
  // performance: {
  //   assetFilter: function(assetFilename) {
  //     return !assetFilename.endsWith('.js')
  //   }
  // },
  output: {
    path: resolve('dist'),
    filename: '[name].js',
    publicPath: '/',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    modules: [
      'node_modules',
      resolve('src'),
      'lib'
    ],
    extensions: ['.js', '.jsx', '.render.jsx', '.render.js', '.json', '.pug', '.styl', '.coffee'],
    alias: {
      '@': resolve('src'),
      '@vendor': resolve('src/vendor'),
      '@misc': resolve('misc')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [/src/, /lib/],
        loader: 'babel-loader',
        options: babelConfig
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'mina-assets-loader'
        ]
      },
      {
        test: /\.pug$/,
        include: /src/,
        use: [
          {
            loader: 'mina-assets-loader',
            options: {
              template: true
            }
          },
          {
            loader: 'wxml-loader'
          },
          {
            loader: 'pug-html-loader',
            options: {
              locals: {
                basedir: path.resolve(__dirname, '../src')
              },
              pretty: true,
              debug: false,
              cache: true,
              basedir: resolve('src')
            }
          }
        ]
      },
      {
        test: /\.s(a|c)ss$/,
        include: /src/,
        exclude: /\.module\.s(a|c)ss$/,
        use: [
          {
            loader: 'mina-assets-loader',
            options: {
              stylesheets: true
            }
          },
          'extract-loader',
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.module\.s(a|c)ss$/,
        include: /src/,
        use: [
          {
            loader: 'mina-assets-loader',
            options: {
              stylesheets: true,
              cssModules: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]'
              },
              url: false
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.styl$/,
        include: /src/,
        use: [
          {
            loader: 'mina-assets-loader',
            options: {
              stylesheets: true
            }
          },
          {
            loader: 'extract-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'stylus-loader',
            options: {
              preferPathResolver: 'webpack',
              import: [
                '~nib/lib/nib/index.styl',
                '~@/utils/var.styl'
              ],
              use: [
                require('nib')(),
                poststylus([
                  rem2rpx({
                    scale: 2
                  })
                ])
              ]
            }
          }
        ]
      }
    ]
  }
}
