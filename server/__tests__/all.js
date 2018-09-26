let db = require('../db');

let sum = (a, b) => a + b;

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test('that the database works', async () => {
  let result = await db.queryAsync('SELECT 1;');
  expect(result.rowCount).toBe(1);
});

afterAll(async () => {
  await db.cleanupTestDatabaseAsync();
}, 10000);
