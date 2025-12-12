const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const browser = env.BROWSER || 'chrome';
  const isProduction = argv.mode === 'production';

  // Output directory based on browser
  const outputPath = browser === 'chrome'
    ? 'dist'
    : browser === 'firefox'
      ? 'dist_firefox'
      : 'dist_safari';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',

    entry: {
      background: './src/background/index.ts',
      content: './src/content/index.ts',
      popup: './src/popup/index.ts',
    },

    output: {
      path: path.resolve(__dirname, outputPath),
      filename: '[name].js',
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
      ],
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@types': path.resolve(__dirname, 'src/types'),
      },
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: `src/manifest.${browser}.json`,
            to: 'manifest.json',
          },
          {
            from: 'src/popup/popup.html',
            to: 'popup.html',
          },
          {
            from: 'src/icons',
            to: 'icons',
          },
          {
            from: 'src/_locales',
            to: '_locales',
          },
        ],
      }),
    ],

    optimization: {
      minimize: isProduction,
    },
  };
};
