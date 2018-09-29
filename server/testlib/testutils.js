let assert = require('assert');
let path = require('path');

let pg = require('pg');
let spawnAsync = require('@expo/spawn-async');
let time = require('@expo/time');

let secret = require('../secret');

async function pg_dumpIsInstalledAsync() {
  try {
    await spawnAsync('pg_dump', ['--version']);
  } catch (e) {
    if (e.message.endsWith('ENOENT')) {
      return false;
    }
    throw e;
  }
  return true;
}

async function getProductionDatabaseSchemaAsync() {
  console.log('db-schema-dump: starting...');
  let tk = time.start();

  if (!await pg_dumpIsInstalledAsync()) {
    throw Error(`
      pg_dump is required for running tests but is not installed.

      To fix this, you can run:

        brew install postgres

    `);
  }
  let pg_dump = path.resolve(__dirname, 'pg_dump');
  let result = await spawnAsync(pg_dump, ['--schema-only']);
  let [stdout, stderr] = result.output;
  let lines = stdout.split('\n');
  let schemaSql = lines
    .filter((line) => {
      switch (line) {
        case '-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: ':
        case 'CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;':
        case '-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: ':
        case "COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';":
          return false;
        default:
          return true;
      }
    })
    .join('\n');
  time.end(tk, 'db-schema-dump');
  return schemaSql;
}

async function createDatabaseAsync(dbName) {
  // We use this to bootstrap the test database enviorment
  // We can't rely on `db.queryAsync` or similar since that's
  // what we're trying to setup.
  //
  // Note that here we use a connection to the *production* database
  // just to run the CREATE DATABASE query we use to make the test
  // database that we're actually going to use
  let { Client } = pg;
  let client = new Client(secret.postgres);
  await client.connect();
  try {
    let result = await client.query('CREATE DATABASE ' + JSON.stringify(dbName) + ';');
    assert.strictEqual(result.command, 'CREATE');
  } finally {
    await client.end();
  }
}

module.exports = {
  getProductionDatabaseSchemaAsync,
  createDatabaseAsync,
  pg_dumpIsInstalledAsync,
};
