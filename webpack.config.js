/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
module.exports = {
  devtool: "source-map",
  entry: {
    runtime: "./src/runtime.ts"
  },
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : "production",
  module: {
    noParse: /browserfs\.js/u,
    rules: [
      {
        exclude: /node_modules|bin/u,
        loader: "ts-loader",
        test: /\.ts$/u
      }
    ]
  },
  node: {
    Buffer: false,
    process: false
  },
  output: {
    filename: "[name].js",
    library: "[name]",
    libraryTarget: "assign",
    path: path.resolve(__dirname, "bin")
  },
  plugins: [
    new webpack.ProvidePlugin({
      BrowserFS: "bfsGlobal",
      Buffer: "bufferGlobal",
      process: "processGlobal"
    })
  ],
  resolve: {
    alias: {
      bfsGlobal: require.resolve("browserfs"),
      buffer: "browserfs/dist/shims/buffer.js",
      bufferGlobal: "browserfs/dist/shims/bufferGlobal.js",
      fs: "browserfs/dist/shims/fs.js",
      path: "browserfs/dist/shims/path.js",
      processGlobal: "browserfs/dist/shims/process.js"
    },
    extensions: [
      ".ts",
      ".js"
    ]
  },
  target: "web"
};
