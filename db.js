let pg = require('pg');

let secret = require('./secret');
let time = require('@expo/time');

let pool = new pg.Pool({
  ...secret.postgres,
  database: secret.postgres.instance,
});

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('[pg] Unexpected error on idle client', err);
  // process.exit(-1);
});

async function queryAsync(...args) {
  let tk = time.start();
  let client = await pool.connect();
  time.end(tk, 'db-connect', { threshold: 10 });
  try {
    let tk = time.start();
    let result = await client.query(...args);
    time.end(tk, 'db-query', { threshold: 0, message: JSON.stringify(args) });
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  queryAsync,
  pg,
  pool,
};
