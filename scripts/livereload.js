const tinylr = require('tiny-lr');
const port = require('../package.json').livereloadPort;

tinylr().listen(port, function() {
  console.log(`Livereload listening on ${port}`);
});
