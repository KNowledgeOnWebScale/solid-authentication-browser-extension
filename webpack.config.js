const CopyWebpackPlugin = require('copy-webpack-plugin')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require('path')
const stdLibBrowser = require('node-stdlib-browser');
const {
    NodeProtocolUrlPlugin
} = require('node-stdlib-browser/helpers/webpack/plugin');
const webpack = require('webpack');

module.exports = {
    entry: {
        background: './src/js/background.js',
        popup: './src/popup/popup.js',
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].js',
    },
    optimization: {
        minimize: false
    },
    resolve: {
        alias: stdLibBrowser
    },
    plugins: [
        new NodeProtocolUrlPlugin(),
        new webpack.ProvidePlugin({
            process: stdLibBrowser.process,
            Buffer: [stdLibBrowser.buffer, 'Buffer']
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    context: 'src/',
                    from: 'popup'
                },
                {
                    context: 'src/',
                    from: 'manifest.json'
                },
                {
                    context: 'src/',
                    from: 'icons'
                }
            ]
        }),
        new NodePolyfillPlugin()
    ],
    mode: 'production'
}
