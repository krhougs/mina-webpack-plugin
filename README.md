# MinaWebpackPlugin
MINA(微信小程序) Webpack 插件。

A Webpack plugin for MINA(WeChat MiniProgram).

> 这个项目正在开发中。
> This project is under construction.

- [x] 基础打包 | basic packaging
- [x] 模板打包 | packaging for templates
- [x] 样式表打包与 CSS Modules | packaging for stylesheets and css modules
- [ ] 静态资源打包 | packaging for static resources
- [ ] 自定义组件打包 | packaging for components
- [ ] Source Maps
- [ ] remax 支持 | support for remax

## 概述 | Overview
- 适用于 Webpack 4 | For Webpack 4;
- 只支持微信小程序 | Compactable with WeChat MINA only;
- 支持直接为使用 [Remax](https://github.com/remaxjs/remax) 的项目打包 | En duo avec [Remax](https://github.com/remaxjs/remax);
- 可使用各种 pre-processors (e.g. Pug, Stylus, e.t.c.) | Compactable with variant pre-processors;
- 支持 Component | Support MINA Component;
- 支持分包 | Support MINA sub-package packing;
- 自动合并依赖(使用 Webpack 的 `SplitChunksPlugin`) | Merge dependencies into one single file using `SplitChunksPlugin`;
- 自动通过配置文件生成 `app.json` 和页面的 JSON 配置 | Genarate but not hard-coding MINA configuration JSONs;
- 已在生产环境中测试并使用 | Build for/in production.

## 配置项 | Plugin Configuration
```js
  {
    // 必填，源码目录绝对对路径
    // required, absolute path of src directory
    basePath: path.join(__dirname, 'src'),
  }
```

## 开始使用 | Getting Started
在 Webpack 配置文件中初始化本插件，并将 `entry` 设置成 `() => ({})` 即可开始使用。

Initialize the plugin and set `entry` to `() => ({})` to get started.

```js
// webpack.config.js
const MinaWebpackPlugin = require('mina-webpack-plugin').default
export default {
  // ...
  entry: () => ({}),
  plugins: [
    new MinaWebpackPlugin()
  ]
}
```

[example](https://github.com/krhougs/mina-webpack-plugin/tree/master/example/simple)

## `mina-assets-loader`
直接使用 `mina-assets-loader` 处理静态资源。

Just let `mina-assets-loader` handle the static assets. 

```js
// src/pages/Index/index.js
import thePicture from './index.pug'

// webpack.config.js
export default {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        include: /src/,
        use: [
          {
            loader: 'mina-assets-loader'
          }
        ]
      }
    ]
  }
}
```

## 模板 | Templates
在页面的主 `entry` 中直接 `import` 对应的模板文件即可。在 module rules 中加入 `mina-assets-loader?template` 以让插件正确处理正确模板。

Directly `import` the template file in the page `entry` to use templates. In order to let the plugin processing the template, add `mina-assets-loader?template` in module rules.

```js
// src/pages/Index/index.js
import './index.pug'

// webpack.config.js
export default {
  // ...
  module: {
    rules: [
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
      }
    ]
  }
}
```

## 样式表与 CSS Modules | Stylesheets and CSS Modules
在页面的主 `entry` 中直接 `import` 对应的样式表文件即可。在 module rules 中加入 `mina-assets-loader?stylesheets` 以让插件正确处理正确样式表。

如需使用 CSS Modules, 开启 `css-loader` 的 `modules` 选项并同时开启 `mina-assets-loader` 的 `stylesheets` 选项与 `cssModules` 选项。

Directly `import` the stylesheets file in the page `entry` to use templates. In order to let the plugin processing stylesheets, add `mina-assets-loader?stylesheets` in module rules.

To use CSS Modules, enable `modules` in `css-loader` and enable both `stylesheets` and `cssModules` in `mina-assets-loader`.

```js
// src/pages/Index/index.js
import './index.sass'
import style from './index.module.sass'


// webpack.config.js
export default {
  // ...
  module: {
    rules: [
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
      }
    ]
  }
}
```

## 授权
MIT
