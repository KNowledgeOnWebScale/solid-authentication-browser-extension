const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        sw: './src/js/sw.js',
        popup: './src/popup/popup.js',
        content: './src/js/content.js',
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
    ],
    mode: 'production'
};
