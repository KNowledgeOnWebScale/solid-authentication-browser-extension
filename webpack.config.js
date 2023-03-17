import CopyWebpackPlugin from 'copy-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import WebExtPlugin from "web-ext-plugin";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    node: false,
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
        new NodePolyfillPlugin(),
        new WebExtPlugin({sourceDir: "../../dist"})
    ],
    mode: 'production'
}

export default config;