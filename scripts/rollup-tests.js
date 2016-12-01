/* eslint-env node */
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const multyEntry = require('rollup-plugin-multi-entry');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const babel = require('rollup-plugin-babel');
const eslintTestGenerator = require('./rollup-plugin-eslint-test-generator');

function rollupTests(dest, cache) {
  return rollup.rollup({
    entry: 'test/**/*.js',
    plugins: [
      eslintTestGenerator({
        paths: [
          'src',
          'test'
        ]
      }),
      globals(),
      builtins(),
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
    ],
    cache
  }).then((bundle) => {
    return bundle.write({
      dest,
      format: 'iife',
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
