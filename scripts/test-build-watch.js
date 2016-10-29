const fetch = require('node-fetch');
const watcher = require('./watcher');
const rollupTests = require('./rollup-tests');
const livereloadPort = require('../package.json').livereloadPort;

let bundle;
let building = false;

const testDestination = process.argv[2];
const reloadUri = `http://localhost:${livereloadPort}/changed?files=tests.js,index.html`

function notifyReload() {
  fetch(reloadUri);
}

watcher([['src', 'js'], ['test', 'js']], () => {
  if (building) {
    watcher.logInfo('Too many rebuilds triggered at once. Skipping a build.');

    return;
  }

  const start = Date.now();

  building = true;

  rollupTests(testDestination, bundle).then((newBundle) => {
    notifyReload();
    building = false;
    watcher.logInfo(`rebuilt bundle in ${Date.now() - start}ms`);
    bundle = newBundle;
  });
});
