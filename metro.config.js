const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .md files bundled as JS string modules (lesson content pipeline)
config.resolver.sourceExts.push('md');
config.transformer.babelTransformerPath = require.resolve('./metro.md-transformer.js');

module.exports = config;
