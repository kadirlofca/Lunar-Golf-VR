const{ CleanWebpackPlugin } = require("clean-webpack-plugin");
const { merge } = require('webpack-merge');
const path = require('path');
const fs = require('fs');
const common = require('./webpack.common.js');

// App directory
const appDirectory = fs.realpathSync(process.cwd());

module.exports = merge(common, {
  output: {
    path: path.resolve(appDirectory, "dist"),
  },
  plugins: [
      new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [path.join(appDirectory, "dist/**/*")],
      }),
  ],
  mode: 'production',
  devtool: 'source-map'
});