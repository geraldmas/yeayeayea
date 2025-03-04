const webpack = require('webpack');

module.exports = function override(config, env) {
  const fallback = {
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    zlib: require.resolve('browserify-zlib'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/'),
    url: require.resolve('url/'),
    assert: require.resolve('assert/'),
    process: false
  };

  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ]);

  // Configuration pour Jest
  if (env === 'test') {
    config.setupFiles = ['<rootDir>/src/tests/testEnv.ts'];
    config.testEnvironment = 'node';
    config.transform = {
      '^.+\\.ts$': 'ts-jest'
    };
    config.moduleNameMapper = {
      '^@/(.*)$': '<rootDir>/src/$1'
    };
  }

  return config;
}; 