const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '..');

// In monorepo, include anche la root per indicizzare i moduli hoistati.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(__dirname, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
