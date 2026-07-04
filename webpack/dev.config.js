const path = require('path');
const webpack = require('webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = {
    mode: 'development',

    devtool: 'cheap-module-source-map',

    entry: {
        APlayer: './src/js/index.js',
    },

    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: '[name].js',
        library: {
            name: '[name]',
            type: 'umd',
            export: 'default',
            umdNamedDefine: true,
        },
        publicPath: '/',
    },

    resolve: {
        modules: ['node_modules'],
        extensions: ['.js', '.scss'],
        fallback: {
            dgram: false,
            fs: false,
            net: false,
            tls: false,
        },
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            presets: ['@babel/preset-env'],
                        },
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [autoprefixer(), cssnano()],
                            },
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader',
                options: {
                    limit: 40000,
                },
            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader',
            },
            {
                test: /\.art$/,
                loader: 'art-template-loader',
            },
        ],
    },

    devServer: {
        compress: true,
        static: {
            directory: path.resolve(__dirname, '..', 'demo'),
        },
        client: {
            logging: 'none',
        },
        open: true,
        historyApiFallback: {
            disableDotRule: true,
        },
        watchFiles: {
            paths: ['src/**/*', 'demo/**/*'],
            options: {
                ignored: /node_modules/,
            },
        },
    },

    plugins: [
        new webpack.DefinePlugin({
            APLAYER_VERSION: `"${require('../package.json').version}"`,
            GIT_HASH: JSON.stringify(gitRevisionPlugin.version()),
        }),
    ],

    performance: {
        hints: false,
    },
};
