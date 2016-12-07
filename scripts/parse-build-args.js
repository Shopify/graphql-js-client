/* eslint-env node */
const minimist = require('minimist');

module.exports = function parseBuildArgs() {
  const args = minimist(process.argv.slice(2), {
    boolean: 'with-profiler',
    default: {
      'with-profiler': false
    }
  });

  const dest = args._[0];
  const withProfiler = args['with-profiler'];

  return {dest, withProfiler};
};
