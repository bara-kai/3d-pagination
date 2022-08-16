const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  // devtool: 'source-map',
  entry: {
    myCommon: './src/javascripts/main.js',
    sub: './src/javascripts/sub.js',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'javascripts/[name]-[contenthash].js',
    publicPath: '/',
  },
  devServer: {
    contentBase: path.join(__dirname, '.dist'),
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: '> 0.25%, not dead' }],
              ],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        ],
      },
      {
        test: /\.(glsl|.bert|.frag)$/,
        use: [
          // loader: 'raw-loader',
          require.resolve('raw-loader'),
          require.resolve('glslify-loader'),
        ],
      },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: { sourceMap: false },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|JPG)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
            },
          },
        ],
      },
      {
        test: /\.pug/,
        use: [
          {
            loader: 'html-loader',
          },
          {
            loader: 'pug-html-loader',
            options: {
              pretty: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: './stylesheets/[name]-[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: './src/templates/index.pug',
      filename: 'index.html',
      chunks: ['myCommon', 'sub'],
      // inject: 'body',
    }),

    new CleanWebpackPlugin(),
  ],
};
