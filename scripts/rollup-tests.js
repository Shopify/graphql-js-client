/* eslint-env node */
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const multyEntry = require('rollup-plugin-multi-entry');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const babel = require('rollup-plugin-babel');
const eslintTestGenerator = require('./rollup-plugin-eslint-test-generator');

function envRollupInfo({browser}) {
  const format = (browser) ? 'iife' : 'cjs';
  const plugins = [
    eslintTestGenerator({
      paths: [
        'src',
        'test'
      ]
    }),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false
    }),
    multyEntry({
      exports: false
    }),
    babel()
  ];
  const external = [];

  if (browser) {
    plugins.unshift(globals(), builtins());
  } else {
    external.push('fs', 'assert');
  }

  return {plugins, external, format};
}

function rollupTests({dest, cache, browser}) {
  const {plugins, external, format} = envRollupInfo({browser});

  return rollup.rollup({
    entry: 'test/**/*.js',
    plugins,
    external,
    cache
  }).then((bundle) => {
    return bundle.write({
      dest,
      format,
      sourceMap: 'inline'
    }).then(() => {
      return bundle;
    });
  }).catch((error) => {
    console.error(error); // eslint-disable-line no-console
    throw error;
  });
}

module.exports = rollupTests;
