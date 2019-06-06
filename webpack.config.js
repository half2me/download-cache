const path = require('path');

module.exports = [
  {
    entry: './src/index.js',
    output: {
      library: 'dwn',
      libraryTarget: 'umd',
      libraryExport: 'default',
      globalObject: 'this',
      path: path.resolve(__dirname, 'dist'),
      filename: 'dwn.js',
    },
  },
  {
    entry: './src/sw.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'sw.js',
    }
  }
];