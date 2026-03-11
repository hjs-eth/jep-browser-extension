const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // 生产模式可改为 'production'
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './src/popup.js',
    options: './src/options.js',
    logs: './src/logs.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // 每次构建前清理 dist 文件夹
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup.html', to: 'popup.html' },
        { from: 'src/options.html', to: 'options.html' },
        { from: 'src/logs.html', to: 'logs.html' },
        { from: 'src/icons', to: 'icons', noErrorOnMissing: true }, // 如果没有图标文件夹也不报错
      ],
    }),
  ],
};
