let db = require('../db');

async function getTestDatabasesToCleanUpAsync() {
  let results = await db.queryAsync(/* SQL */ `
  SELECT datname FROM pg_database WHERE datname LIKE '%__test__';
  `);
  let databaseNames = [];
  for (let row of results.rows) {
    databaseNames.push(row.datname);
  }
  return databaseNames;
}

async function cleanupTestDatabasesAsync() {
  let databaseNames = await getTestDatabasesToCleanUpAsync();
  for (let dbName of databaseNames) {
    if (dbName.endsWith('__test__')) {
      await db.queryAsync(`DROP DATABASE ${db.iq(dbName)};`);
    }
  }
}

module.exports = {
  getTestDatabasesToCleanUpAsync,
  cleanupTestDatabasesAsync,
};
