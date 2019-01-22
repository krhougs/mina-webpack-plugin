# MinaWebpackPlugin
MINA(微信小程序) Webpack 插件。

*编译环境的 Node.js 需要支持 async/await*

## 概述
- 适用于 Webpack 4;
- 可使用各种 pre-processors (e.g. Pug, Stylus, e.t.c.);
- 支持 Component;
- 支持分包;
- 自动合并依赖(使用 Webpack 的 SplitChunksPlugin);
- 自动根据分包打包资源文件;
- 自动通过配置文件生成 `app.json` 和页面的 JSON 配置;
- 已在生产环境中测试并使用.

## 配置项
```js
  {
    basePath: null, // 必填，源码目录绝对对路径
    testAsset (filename) {
      // 非必填， 返回 boolean 以判断所引用的文件是否应该作为资源打包
    }
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
    entry: () => {},
    optimization: {},
    plugins: [
      new MinaWebpackPlugin({
        basePath: resolve('src')
      }),
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
              loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            {
              loader: 'stylus-loader'
            }
          ]
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
