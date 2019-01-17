/*try {
  // For render.com deployment
  module.exports = require('/etc/secrets/ghost-secret');
} catch (e) {
  try {
    // If you put a symlink in the server/ directory
    module.exports = require('./ghost-secret');
  } catch (e) {
    try {
      // If you just cloned ghost-secret into a peer directory to ghost-server
      module.exports = require('../../ghost-secret');
    } catch (e2) {
      console.error(
        "Couldn't load ghost-secret. Make a symlnk in this directory to where the ghost-secret private repo is."
      );
      throw new Error(e + '\n' + e2);
    }
  }
}*/

module.exports = {
  postgres: {
    host: '127.0.0.1',
    user: 'castle',
    password: 'castle',
    database: 'castle_small_server',
  },
  aws: {
    accessKeyId: 'AKIAIYZJVIYATRZDBP5Q',
    secretAccessKey: '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',
  },
};
