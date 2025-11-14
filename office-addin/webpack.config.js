const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: {
      taskpane: './src/index.tsx'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/taskpane.html',
        filename: 'taskpane.html',
        chunks: ['taskpane']
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      hot: true,
      port: 3000,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      https: true
    },
    devtool: isDevelopment ? 'source-map' : false
  };
};
