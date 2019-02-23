# MinaWebpackPlugin
MINA(微信小程序) Webpack 插件。

*编译环境的 Node.js 需要支持 async/await*

## 概述
- 适用于 Webpack 4;
- 可使用各种 pre-processors (e.g. Pug, Stylus, e.t.c.);
- 支持 Component;
- 支持分包;
- 自动合并依赖(使用 Webpack 的 SplitChunksPlugin);
- 自动根据分包配置打包资源文件;
- 自动通过配置文件生成 `app.json` 和页面的 JSON 配置;
- 已在生产环境中测试并使用.

## 配置项
```js
  {
    basePath: path.join(__dirname, 'src'), // 必填，源码目录绝对对路径
    testAsset (filename) {
      // 非必填， 返回 boolean 以判断所引用的文件是否应该作为资源打包
    }
  }
```

## 例子
TODO

## 授权
MIT

## 其他
- 不为任何使用本插件所造成的损失负责;
- 欢迎 contribute!
