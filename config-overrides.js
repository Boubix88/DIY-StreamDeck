const path = require('path');

module.exports = function override(config, env) {
  // Add path aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    '@shared': path.resolve(__dirname, 'src/shared'),
    '@renderer': path.resolve(__dirname, 'src/renderer'),
    '@main': path.resolve(__dirname, 'src/main')
  };

  return config;
};
