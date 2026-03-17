const path = require('path');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const cache = {
  type: 'filesystem',
  cacheDirectory: path.resolve(__dirname, '../../.webpack-cache'),
  buildDependencies: {
    config: [__filename],
  },
};

const tsRule = {
  test: /\.tsx?$/,
  use: {
    loader: 'ts-loader',
    options: {
      // tsc handles type-checking via the standalone build step
      transpileOnly: true,
      configFile: path.resolve(__dirname, 'tsconfig.json'),
    },
  },
  exclude: /node_modules/,
};

const cssRule = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

const baseResolve = {
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
};

const outputPath = path.resolve(__dirname, '../../dist');

const createConfig = ({ name, target, entry, resolve: extraResolve = {}, output: extraOutput = {} }) => ({
  name,
  mode,
  target,
  entry,
  cache,
  module: {
    rules: [tsRule, cssRule],
  },
  resolve: {
    ...baseResolve,
    ...extraResolve,
  },
  output: {
    filename: `${name}.js`,
    path: outputPath,
    ...extraOutput,
  },
});

const rendererConfig = createConfig({
  name: 'renderer',
  target: 'web',
  entry: './src/renderer.tsx',
  output: {
    chunkFilename: 'apps/frontend/chunks/[name].[contenthash].js',
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    conditionNames: ['browser', 'import', 'module', 'default'],
  },
});

const preloadConfig = createConfig({
  name: 'preload',
  target: 'electron-preload',
  entry: './src/preload.ts',
});

module.exports = [rendererConfig, preloadConfig];
