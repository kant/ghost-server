let time = require('@expo/time');

// Timers; a little weird to have them be module-level globals but its the 
// best way to time things in a way that captures the time taken to require code too
let _tk = time.start();
let _tkReady = time.start();

let bodyParser = require('body-parser');
let cors = require('cors');
let escapeHtml = require('escape-html');
let express = require('express');
let thinServer = require('thin-server');
let spawnAsync = require('@expo/spawn-async');

let Api = require('./Api');
let db = require('./db');

async function serveAsync(port) {
  let serverState = 'starting';
  let app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.get('/status', async (req, res) => {
    res.json({serverState, });
  });
  app.post('/api', thinServer(Api));
  app.get('/', async (req, res) => {
    let pkg = require('./package');
    let gitResult = await spawnAsync('git', ['log', '--pretty=oneline', '-n1']);
    res.send(
      '<pre>👻 ' +
        pkg.name +
        ' v' +
        pkg.version +
        '</a><br /><br /><a href="' +
        pkg.repository +
        '">' +
        escapeHtml(gitResult.stdout) +
        '</a></pre>'
    );
  });

  // Start the server and create a Promise for when its done starting
  port = port || process.env.PORT || 1380;
  let listenA = new Promise((resolve, reject) => {
    app.listen(port, () => {
      time.end(_tk, 'server-start');
      console.log('Ghost server listening on port ' + port);
      resolve();
    });
  });

  // Make a simple query to the database to force a connection, etc. 
  let primeA = db.queryAsync('SELECT 1 AS primed');

  // Wait for the server to start and the priming query to complete
  await Promise.all([listenA, primeA]);

  // Server is now ready
  serverState = 'ready';
  time.end(_tkReady, 'ready');
}

module.exports = serveAsync;

if (require.main === module) {
  serveAsync();
}
