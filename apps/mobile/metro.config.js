const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// ── Monorepo: watch all packages so Metro sees @tunax/shared ──────────────────
config.watchFolders = [workspaceRoot];

// Resolve from both local node_modules and workspace root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ── NativeWind v4 ─────────────────────────────────────────────────────────────
module.exports = withNativeWind(config, { input: './global.css' });
