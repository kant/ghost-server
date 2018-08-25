let time = require('@expo/time');
let _tk = time.start();

let express = require('express');
let thinServer = require('thin-server');
let bodyParser = require('body-parser');

let Api = require('./Api');

async function serveAsync(port) {
  let app = express();
  app.use(bodyParser.json());
  app.post('/api', thinServer(Api));
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
