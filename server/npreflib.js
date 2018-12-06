let url = require('url');

function nprefFromUrl(url_) {
  return url_.replace(/^([^:\/]+:)?\/\//, '//');
}

module.exports = {
  nprefFromUrl,
}