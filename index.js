let time = require('@expo/time');
let _tk = time.start();

let bodyParser = require('body-parser');
let cors = require('cors');
let escapeHtml = require('escape-html');
let express = require('express');
let thinServer = require('thin-server');
let spawnAsync = require('@expo/spawn-async');

let Api = require('./Api');

async function serveAsync(port) {
  let app = express();
  app.use(cors());
  app.use(bodyParser.json());
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
  port = port || process.env.PORT || 1380;
  app.listen(port, () => {
    time.end(_tk, 'server-start');
    console.log('Ghost server listening on port ' + port);
  });
}

module.exports = serveAsync;

if (require.main === module) {
  serveAsync();
}
