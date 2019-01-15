let secret = require('./secret');

var knex = require('knex')({
  client: 'pg',
  connection: {
    ...secret.postgres,
  },
});

module.exports = knex;
