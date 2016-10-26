const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const multyEntry = require('rollup-plugin-multi-entry');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const babel = require('rollup-plugin-babel');

function rollupTests(cache, dest) {
  return rollup.rollup({
    entry: 'test/**/*.js',
    plugins: [
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
      dest: 'dist/tests.js',
      format: 'iife',
      sourceMap: 'inline'
    }).then(() => {
      return bundle;
    });
  }).catch((e) => {
    console.error(e);
    throw e;
  });
}

module.exports = rollupTests;
