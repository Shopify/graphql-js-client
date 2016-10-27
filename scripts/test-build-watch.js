const watcher = require('./watcher');
const rollupTests = require('./rollup-tests');

let bundle;

watcher([['src', 'js'], ['test', 'js']], () => {
  const start = Date.now();

  rollupTests('.tmp/test/tests.js', bundle).then((newBundle) => {
    watcher.logInfo(`rebuilt bundle in ${Date.now() - start}ms`);
    bundle = newBundle;
  });
});
