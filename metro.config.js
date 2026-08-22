const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit Metro worker processes to prevent out-of-memory crashes on Windows
config.maxWorkers = 2;

module.exports = config;
