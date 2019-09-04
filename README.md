# MinaWebpackPlugin
MINA(微信小程序) Webpack 插件。

A Webpack plugin for MINA(WeChat MiniProgram).

> 这个项目正在开发中。
> This project is under construction.

- [x] 基础打包 | basic packaging
- [x] 模板打包 | packaging for templates
- [ ] 样式表打包 | packaging for stylesheets
- [ ] 自定义组件打包 | packaging for components
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
    // 非必填， 返回 boolean 以判断所引用的文件是否应该作为资源打包
    // not required, it returns a boolean to determine whether a dependency should be treated as an asset.
    testAsset (filename) {
      // do something
    }
  }
```

## 授权
MIT
