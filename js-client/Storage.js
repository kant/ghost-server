try {
  module.exports = require('./storage/FileSystemStorage');
} catch (e) {
  module.exports = require('./storage/InMemoryStorage');
}