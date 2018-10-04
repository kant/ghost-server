let time = require('@expo/time');
let _tkLoaded = time.start();
let _tkPrimedAndStarted = time.start();

let bodyParser = require('body-parser');
let cors = require('cors');
let escapeHtml = require('escape-html');
let fileType = require('file-type');
let spawnAsync = require('@expo/spawn-async');

let db = require('./db');
let graphqlApp = require('./graphqlApp');
let model = require('./model');
let populateTestDatabase = require('./testlib/populateTestDatabase');

async function serveAsync(port) {
  let endpoints = {
    status: '/status',
    graphql: '/graphql',
    playground: '/graphql',
    subscriptions: '/subscriptions',
    origin: '/origin',
  };

  let app = await graphqlApp.graphqlAppAsync();

  app.use(cors());
  app.use(bodyParser.json());
  app.get(endpoints.status, async (req, res) => {
    // Don't pollute the logs with timing for status requests
    // unless they become very slow for some reason
    // (Render will ping every few seconds to make sure the server is OK)
    req.__timingThreshold = 1000;
    res.json({ status: 'OK' });
  });

  // Homepage with some info
  app.get('/', async (req, res) => {
    let pkg = require('./package');
    let gitResult = await spawnAsync('git', ['log', '--pretty=oneline', '-n1']);
    let gitStatusResult = await spawnAsync('git', ['status']);
    let links = [];
    for (let name in endpoints) {
      links.push(
        '    ' +
          name +
          '  ' +
          '<a href=' +
          JSON.stringify(endpoints[name]) +
          '>' +
          endpoints[name] +
          '</a>'
      );
    }

    let title = '👻 ' + pkg.name + ' v' + pkg.version;

    res.send(`
<html>
<head>
<title>${title}</title>
</head>
<body>
<pre>${title}

${links.join('\n')}


<a href="${pkg.repository}">${escapeHtml(gitResult.stdout)}</a>
<small>
${escapeHtml(gitStatusResult.stdout)}
</small>
</pre>
</body>
</html>
    `);
    
  });

  app.get(endpoints.origin, async (req, res) => {
    res
      .status(404)
      .type('text/plain')
      .send(
        'You can download the origin file for a hosted file at the URL ' +
          req.baseUrl +
          '/origin/<fileId>'
      );
  });

  app.get(endpoints.origin + '/:fileId', async (req, res) => {
    let fileId = req.params.fileId;
    if (!fileId) {
      res.status(404).send('No such file');
      return;
    }
    let file = await model.getUploadedFileAsync(fileId);
    if (!file) {
      res.status(404).send('No such file');
      return;
    }
    let mimeType = file.mimeType;
    if (!mimeType) {
      let ft = fileType(file.data);
      if (ft) {
        mimeType = ft.mime;
      }
    }
    if (mimeType) {
      res.type(mimeType);
    } else {
      console.warn("Can't figure out the MIME type for " + fileId + ' but sending data anyway');
    }
    res.send(file.data);
  });

  // Report the time it takes to load all the code separate
  // from the time it takes to connect to the database
  time.end(_tkLoaded, 'loaded');

  // Make a connection to the database so its ready to go
  await db.queryAsync('SELECT 1 AS primed');

  if (process.env.NODE_ENV === 'test') {
    await populateTestDatabase.populateDatabaseAsync();
  }

  // Start the server
  port = port || process.env.PORT || 1380 + 2 * (process.env.NODE_ENV === 'test');
  app.start(
    {
      port,
      endpoint: endpoints.graphql,
      subscriptions: endpoints.subscriptions,
      playground: endpoints.playground,
    },
    (info) => {
      time.end(_tkPrimedAndStarted, 'server-start');
      console.log('Ghost server listening on port ' + info.port);
      console.log('http://localhost:' + port + '/');
    }
  );

  return app;
}

module.exports = serveAsync;

if (require.main === module) {
  serveAsync();
}
