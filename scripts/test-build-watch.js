const watcher = require('./watcher');
const rollupTests = require('./rollup-tests');

let bundle;
let building = false;

const testDestination = process.argv[2];

watcher([['src', 'js'], ['test', 'js']], () => {
  if (building) {
    watcher.logInfo('Too many rebuilds triggered at once. Skipping a build.');

    return;
  }

  const start = Date.now();

  building = true;

  rollupTests(testDestination, bundle).then((newBundle) => {
    building = false;
    watcher.logInfo(`rebuilt bundle in ${Date.now() - start}ms`);
    bundle = newBundle;
  });
});
