let assert = require('assert');

let pg = require('pg');
let time = require('@expo/time');

let secret = require('./secret');
let testutils = require('./testlib/testutils');

let _config = {
  ...secret.postgres,
};

// If we are in a test environment, make a copy of the schema
// of production environment and a new database and then give
// it the same schema and then use it
let dbReady$ = Promise.resolve(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'test') {
  console.warn("// Using test environment because `process.env.NODE_ENV` is 'test'");

  async function _prepareTestDatabaseAsync() {
    // Sanity check
    assert.strictEqual(process.env.NODE_ENV, 'test');

    // Pick a name for the new database
    let testDatabaseName = secret.postgres.database + '__';
    let abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 10; i++) {
      testDatabaseName += abc.charAt(Math.floor(Math.random() * abc.length));
    }
    testDatabaseName += '__test__';

    // Create it
    await testutils.createDatabaseAsync(testDatabaseName);

    // Use it
    _config.database = testDatabaseName;
    console.warn("// Using database " + _config.database);

    // Copy over the schema
    let schemaSql = await testutils.getProductionDatabaseSchemaAsync();
    let client = new pg.Client(_config);
    await client.connect();
    await client.query(schemaSql);
    await client.end();

    // Clean up after ourselves at the end of this process
    process.on('exit', () => {
      if (_config.database.endsWith('__test__')) {
        db.queryAsync('DROP DATABASE ' + JSON.stringify(_config.database) + ';');
      }
    });

    // Now we're ready
    return process.env.NODE_ENV;
  }

  dbReady$ = _prepareTestDatabaseAsync();
}

let _pool = null;
async function poolAsync() {
  if (_pool === null) {
    await dbReady$;
    _pool = new pg.Pool(_config);

    // the pool with emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    _pool.on('error', (err, client) => {
      console.error('[pg] Unexpected error on idle client', err);
      // process.exit(-1);
    });
  }
  return _pool;
}

async function queryAsync(...args) {
  let tk = time.start();
  let pool = await poolAsync();
  let client = await pool.connect();
  time.end(tk, 'db-connect', { threshold: 10 });

  // Construct message for logging this
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

  let tkq = time.start();
  let queryOk = false;
  try {
    let result = await client.query(...args);
    queryOk = true;
    return result;
  } finally {
    time.end(tkq, 'db-query' + (queryOk ? '' : '-error'), { threshold: 0, message });
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

async function sanityCheckEnvironmentIsntProductionAsync() {
  let result;
  try {
    result = await queryAsync(`SELECT "env" FROM "env";`);
  } catch (e) {
    if (e.code === '42P01') {
      // "env" isn't a table so that means we're OK
      return;
    } else {
      throw e;
    }
  }
  if (result.rowCount > 0) {
    if (result.rows[0].env === 'production') {
      // Maybe even `process.exit` here?
      throw new Error('Refusing to proceed in production environment');
    }
  }
}

module.exports = {
  queryAsync,
  replacer,
  pg,
  poolAsync,
  _config,
  _pool,
  dbReady$,
  iq,
  sanityCheckEnvironmentIsntProductionAsync,
};
