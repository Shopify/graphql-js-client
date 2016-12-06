/* eslint-env node */
const dest = process.argv[2];
const rollupTests = require('./rollup-tests');

rollupTests({dest, browser: false});
