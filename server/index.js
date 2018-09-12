let time = require('@expo/time');
let _tkLoaded = time.start();
let _tkPrimedAndStarted = time.start();

let bodyParser = require('body-parser');
let cors = require('cors');
let escapeHtml = require('escape-html');
let express = require('express');
let thinServer = require('thin-server');
let spawnAsync = require('@expo/spawn-async');

let Api = require('./Api');
let db = require('./db');

async function serveAsync(port) {
  let app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.get('/status', async (req, res) => {
    res.json({ status: 'OK' });
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

  // Report the time it takes to load all the code separate
  // from the time it takes to connect to the database
  time.end(_tkLoaded, 'loaded');

  // Make a connection to the database so its ready to go
  await db.queryAsync('SELECT 1 AS primed');

  // Start the server
  port = port || process.env.PORT || 1380;
  app.listen(port, () => {
    time.end(_tkPrimedAndStarted, 'server-start');
    console.log('Ghost server listening on port ' + port);
  });
}

module.exports = serveAsync;

if (require.main === module) {
  serveAsync();
}
