let Storage = require('./storage/ReactNativeAsyncStorage');
let Client = require('./Client');

let storage = new Storage();

module.exports = (url, opts) => {
  return Client(url, {
    storage,
    ...opts,
  });
};
