let pg = require('pg');

let secret = require('./secret');
let time = require('@expo/time');

let pool = new pg.Pool(secret.postgres);

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('[pg] Unexpected error on idle client', err);
  // process.exit(-1);
});

async function queryAsync(...args) {
  // console.log(args);
  let tk = time.start();
  let client = await pool.connect();
  time.end(tk, 'db-connect', { threshold: 10 });
  try {
    let tk = time.start();
    let result = await client.query(...args);

    // let message = JSON.stringify(args);
    let [query, values] = args;
    let logLimit = 256;
    let message = query.substr(0, logLimit);
    if (query.length > logLimit) {
      message += '...';
    }
    if (values) {
      message += ' ' + JSON.stringify(values.slice(0, 4));
      if (values.length > 4) {
        message = message.substr(0, message.length - 1) + ', ... ]';
      }
    }

    time.end(tk, 'db-query', { threshold: 0, message });
    return result;
  } finally {
    client.release();
  }
}

function replacer() {
  let values = [];

  let r = (val) => {
    values.push(val);
    return '$' + values.length;
  };

  r.json = (val) => {
    return r(JSON.stringify(val));
  };

  r.values = () => {
    return values;
  };

  return r;
}

let iq = JSON.stringify;

module.exports = {
  queryAsync,
  replacer,
  pg,
  pool,
  iq,
};
