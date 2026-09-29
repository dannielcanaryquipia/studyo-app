/**
 * Babel transformer for .md files (registered via babelTransformerPath).
 * .md → `module.exports = "<raw text>"` JS module.
 * All other files delegate to Expo's default babel transformer, which
 * handles TypeScript, JSX, and all Expo-specific transforms.
 */
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

module.exports.transform = function mdBabelTransform({ filename, src, options, plugins }) {
  if (/\.mdx?$/.test(filename)) {
    const jsSrc = `module.exports = ${JSON.stringify(src)};`;
    return upstreamTransformer.transform({ filename: filename + '.js', src: jsSrc, options, plugins });
  }
  return upstreamTransformer.transform({ filename, src, options, plugins });
};
