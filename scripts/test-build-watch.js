/* eslint-env node */
const fetch = require('node-fetch');
const testGenerator = require('eslint-test-generator').default;
const fs = require('fs');
const watcher = require('./watcher');
const rollupTests = require('./rollup-tests');
const livereloadPort = require('../package.json').livereloadPort;

let bundle;

const testDestination = process.argv[2];
const reloadUri = `http://localhost:${livereloadPort}/changed?files=tests.js,index.html`;

function notifyReload() {
  fetch(reloadUri);
}

function lint(path) {
  return testGenerator({
    template: `{{#each results}}
  test('{{file}} should lint', () => {
    assert.ok({{lintOK}}, '{{message}}');
  })

  {{/each}}`,
    paths: [path],
    maxWarnings: 0
  });
}

const lintResultCache = {};

function lintFiles(files, cache) {
  const newLints = files.reduce((results, fileName) => {
    results[fileName] = lint(fileName);

    return results;
  }, {});

  Object.assign(cache, newLints);
}

function writeLints(lints) {
  const lintTests = Object.keys(lints).map((fileName) => {
    return lints[fileName];
  }).join('\n');

  const output = `import assert from 'assert';
suite('lint-tests', function() {
${lintTests}
});`;

  fs.writeFileSync('.tmp/lints/results.js', output);
}

watcher([['src', 'js'], ['test', 'js']], (response) => {
  const start = Date.now();

  const changedFiles = response.files.map((file) => file.name);

  lintFiles(changedFiles, lintResultCache);
  writeLints(lintResultCache);

  rollupTests(testDestination, bundle).then((newBundle) => {
    notifyReload();
    watcher.logInfo(`rebuilt bundle in ${Date.now() - start}ms`);

    bundle = newBundle;
  }).catch((error) => {
    watcher.logInfo(`Error during build ${error}`);
    console.error(error); // eslint-disable-line no-console
  });
});
