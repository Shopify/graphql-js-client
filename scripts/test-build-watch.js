const watchman = require('fb-watchman');
const rollupTests = require('./rollup-tests');

function logInfo(args) {
  console.info.apply(console, ['[WATCH]'].concat(args));
}

function logWarning(args) {
  console.warn.apply(console, ['[WATCH] warning'].concat(args));
}

function handleFatalError(args) {
  console.error.apply(console, ['[WATCH] error'].concat(args));
  process.exit(1);
}

function handleSubscription(error, resp) {
  if (error) {
    handleFatalError('failed to subscribe: ', error);

    return;
  }
  logInfo(`subscription ${resp.subscribe} established`);
}

function createClient() {
  const client = new watchman.Client();

  client.on('end', () => {
    logInfo('client ended');
  });

  client.on('error', (error) => {
    handleFatalError('Error while talking to watchman: ', error);
  });

  return client;
}

function checkCapabilities(client) {
  client.capabilityCheck({required:['wildmatch']}, (error, resp) => {
    if (error) {
      handleFatalError(
        'Error checking capabilities',
        error,
        'Please "brew install watchman" and make sure your watchman version is up to date'
      );

      return;
    }

    logInfo('Talking to watchman version', resp.version);
  });
}

function createSubscriptions(client) {
  client.command(['watch-project', process.cwd()], (error, resp) => {
    if (error) {
      handleFatalError('Error initiating watch:', error);

      return;
    }

    if (resp.warning) {
      logWarning(resp.warning);
    }

    client.command(['subscribe', process.cwd(), 'src', {
        expression: ['allof',
          ['dirname', 'src'],
          ['type', 'f'],
          ['not', 'empty'],
          ['suffix', 'js']
        ],
        fields: ['name']
      }], handleSubscription
    );

    client.command(['subscribe', process.cwd(), 'test', {
        expression: ['allof',
          ['dirname', 'test'],
          ['type', 'f'],
          ['not', 'empty'],
          ['suffix', 'js']
        ],
        fields: ['name']
      }], handleSubscription
    );
  });
}

const client = createClient();
checkCapabilities(client);
createSubscriptions(client);

var bundle;
var building;

client.on('subscription', (resp) => {
  if (building) {
    logInfo('Triggered task before build completed. Skipping.');
    return;
  }

  const start = Date.now();
  building = true;
  rollupTests(bundle).then((newBundle) => {
    logInfo(`rebuilt bundle in ${Date.now() - start}ms`);
    bundle = newBundle;
    building = false;
  });
});
