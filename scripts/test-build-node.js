/* eslint-env node */
const rollupTests = require('./rollup-tests');
const parseBuildArgs = require('./parse-build-args');

const {dest, withProfiler} = parseBuildArgs();

rollupTests({dest, withProfiler, browser: false});
