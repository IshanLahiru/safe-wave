const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// Add support for additional source extensions
config.resolver.sourceExts.push(
  'jsx',
  'js',
  'ts',
  'tsx',
  'json'
);

module.exports = config;
