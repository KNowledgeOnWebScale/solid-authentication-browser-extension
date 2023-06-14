const config = require('./webpack.config');

config.optimization = {
    minimize: false,
};

config.mode = 'development';
config.devtool = 'inline-source-map';

module.exports = config;
