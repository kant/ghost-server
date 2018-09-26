let db = require('../db');

function sum(a, b) {
  return a + b;
}

beforeAll(async () => {
  await db.queryAsync('SELECT 1;');
}, 30);

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

X = 'thespot';
test('checks that X marks the spot', () => {
  expect(global.X).toBe('thespot');
});

test('that the database works', async () => {
  let result = await db.queryAsync('SELECT 1;');
  expect(result.rowCount).toBe(1);
});
