const watcher = require('./watcher');
const rollupTests = require('./rollup-tests');

let bundle;

const testDestination = process.argv[2];

watcher([['src', 'js'], ['test', 'js']], () => {
  const start = Date.now();

  rollupTests(testDestination, bundle).then((newBundle) => {
    watcher.logInfo(`rebuilt bundle in ${Date.now() - start}ms`);
    bundle = newBundle;
  });
});
