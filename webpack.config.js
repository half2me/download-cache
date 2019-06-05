const path = require('path');

module.exports = {
  entry: {
    dwn: './src/index.js',
    sw: './src/sw.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
};