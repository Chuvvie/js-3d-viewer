(function () {
    'use strict';

    const webpack = require('webpack');
    const path = require('path');
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    const CopyWebpackPlugin = require('copy-webpack-plugin');
    module.exports = {
        mode: 'development',
        entry: {
            'js-3d-viewer': path.resolve(__dirname, './src/app/app.js')
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }]
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './dist'
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'Sample App',
                chunks: ['js-3d-viewer'],
                inject: false,
                template: 'src/sample.html'
            }),
            new webpack.ProvidePlugin({
                THREE: "three"
            }),
            new CopyWebpackPlugin([
                { from: 'src/assets', to: 'assets' }
            ])
        ],
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/'
        }
    };
})();
