try {
  module.exports = require('/etc/secrets/ghost-secret');
} catch (e) {
  try {
    module.exports = require('./ghost-secret');
  } catch (e) {
    try {
      module.exports = require('../ghost-secret');
    } catch (e2) {
      console.error(
        "Couldn't load ghost-secret. Make a symlnk in this directory to where the ghost-secret private repo is."
      );
      throw new Error(e + '\n' + e2);
    }
  }
}
