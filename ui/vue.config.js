const CompressionWebpackPlugin = require('compression-webpack-plugin')
module.exports = {
    chainWebpack: config => {
      config
        .plugin('html')
        .tap(args => {
          args[0].title= '离线下载器 by OrdosX'
          return args
        })
    },
    productionSourceMap: false,
    configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.plugins.push(
        new CompressionWebpackPlugin({
          test: /\.js$|\.html$|\.css$/,
          threshold: 4096
        })
      )
    }
  }
}