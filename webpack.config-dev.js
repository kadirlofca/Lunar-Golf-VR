const { merge } = require('webpack-merge');
const path = require('path');
const fs = require('fs');
const common = require('./webpack.common.js');
const { exit } = require('process');

// App directory
const appDirectory = fs.realpathSync(process.cwd());

// Host
const host = process.env.HOST || 'localhost';

module.exports = merge(common, {
    mode: 'development',

    // Entry point of app
    entry: path.resolve('src'),

    devServer: {
        port: 8080, //port that we're using for local host (localhost:8080)
        static: path.resolve(appDirectory), //tells webpack to serve from the app directory
        compress: true,
        hot: true,
        host: 'local-ip',
        
        open: true,
        devMiddleware: {
            publicPath: "/",
        },

        //enable the use of WebXR
        server: 'https'
    }
});

