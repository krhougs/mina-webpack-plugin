# MinaWebpackPlugin
MINA(微信小程序) Webpack 插件。

*编译环境的 Node.js 需要支持 async/await*

## 概述
- 适用于 Webpack 4;
- 可使用各种 pre-processors (e.g. Pug, Stylus, e.t.c.);
- 支持 Component 等新加入的特性;
- 自动合并依赖(使用 Webpack 的 SplitChunksPlugin);
- 暂不支持分包;
- 已在生产环境中测试并使用.

## 配置项
```js
  {
    basePath: null, // 源码目录相对路径
    entryName: 'app', // app.js 的 entry 名
    entryChunkName: 'common', // 资源文件的 chunk 名, 不能为空
    extensions: ['.js'], // 脚本部分扩展名, 使用时直接配置扩展名和 loader 即可
    assetExtensions: ['.wxml', '.wxss', '.pug', '.styl', '.scss'], // 样式与模板部分扩展名, 使用时直接配置扩展名和 loader 即可
    vendorFilename: 'common.js' // 依赖合并后的文件名
  }
```

## 例子
```js
  const path = require('path')
  const webpack = require('webpack')

  const babelConfig = require('../.babelrc')
  const MinaWebpackPlugin = require('mina-webpack-plugin')

  function resolve (dir) {
    return path.join(__dirname, '..', dir)
  }

  module.exports = {
    entry: {
      app: './src/app.js'
    },
    optimization: {},
    plugins: [
      new MinaWebpackPlugin(),
      new webpack.LoaderOptionsPlugin({
        pugLoader: {
          locals: {
            basedir: path.resolve(__dirname, '../src') + '/'
          },
          pretty: true,
          debug: false,
          cache: true,
          basedir: path.resolve(__dirname, '../src') + '/'
        }
      })
    ].filter(function (e) { return e }),
    output: {
      path: resolve('dist'),
      filename: '[name].js',
      publicPath: '/',
      libraryTarget: 'commonjs2'
    },
    resolve: {
      modules: [
        'node_modules',
        path.resolve(__dirname, 'src'),
        'lib'
      ],
      extensions: ['.js', '.json', '.pug', '.styl', '.coffee'],
      alias: {
        '@': resolve('src')
      }
    },
    module: {
      rules: [
        {
          test: /\.(json)$/,
          include: /src/,
          use: [
            {
              loader: 'file-loader',
              options: {
                useRelativePath: true,
                name: '[name].[json]',
                context: resolve('src')
              }
            },
            {
              loader: 'raw-loader'
            }
          ]
        },
        {
          test: /\.js$/,
          include: [/src/, /lib/],
          loader: 'babel-loader',
          options: babelConfig
        },
        {
          test: /\.pug$/,
          include: /src/,
          use: [
            {
              loader: 'file-loader',
              options: {
                useRelativePath: true,
                name: '[name].wxml',
                context: resolve('src')
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
                data: {
                  strings: {}
                },
                pretty: true,
                debug: false,
                cache: true,
                basedir: path.resolve(__dirname, '../src')
              }
            }
          ]
        },
        {
          test: /\.styl$/,
          include: /src/,
          use: [
            {
              loader: 'file-loader',
              options: {
                useRelativePath: true,
                name: '[name].wxss',
                context: resolve('src')
              }
            },
            {
              loader: 'extract-loader'
            },
            {
              loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            {
              loader: 'stylus-loader'
            }
          ]
        },
        {
          test: /\.(jpe?g|png|svg)(\?.*)?$/,
          include: /src/,
          loader: 'file-loader',
          options: {
            name: 'images/[name].[hash:7].[ext]'
          }
        },
        {
          test: /\.(gif)(\?.*)?$/,
          include: /src/,
          loader: 'url-loader',
          options: {
            name: 'images/[name].[hash:7].[ext]'
          }
        },
        {
          test: /\.(woff2?|eot|ttf|otf|woff)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 100000,
            name: 'fonts/[name].[hash:7].[ext]'
          }
        }
      ]
    }
  }
```

## 授权
MIT

## 其他
- 不为任何使用本插件所造成的损失负责;
- 欢迎 contribute!
