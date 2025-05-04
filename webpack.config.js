const path = require('path');

module.exports = {
  entry: './src/client/index.ts',  // Entry point for your client-side TypeScript
  output: {
    filename: 'bundle.js',  // Output bundled file
    path: path.resolve(__dirname, 'public/js'),  // Output directory
  },
  resolve: {
    extensions: ['.ts', '.js'],  // Resolve .ts and .js files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // Find all .ts files
        use: 'ts-loader',  // Use ts-loader to transpile TypeScript to JavaScript
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',  // Use development mode for easier debugging
};
