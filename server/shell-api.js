let path = require('path');

let Api = require("./Api");

let api = new Api();
api._context = {};

try {
  // This is just for convenience so let's try to read the JSON file in the homedir
  let storedJson = fs.readFileSync(path.join(process.env.HOME, '.ghost-client.json'), 'utf8');
  Object.assign(api._context, JSON.parse(storedJson));
} catch (e) {
  // Not using stored JSON. Is probably OK though.
}

module.exports = api;