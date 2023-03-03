const CopyWebpackPlugin = require('copy-webpack-plugin')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require('path')
//const webpack = require('webpack')

module.exports = {
    entry: {
        background: './src/js/background.js',
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].js',
    },

    plugins: [
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