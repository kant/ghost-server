let assert = require('assert');

let db = require('./db');
let idlib = require('./idlib');

let js = JSON.stringify;

async function multigetObjectsAsync(idList, table, opts) {
  opts = opts || {};
  let column = opts.column || table + 'Id';
  let results = await db.queryAsync(
    'SELECT * FROM ' +
      js(table) +
      ' WHERE ' +
      js(column) +
      ' IN (' +
      idList.map((_, n) => '$' + (n + 1)).join(', ') +
      ');',
    idList
  );
  let x = {};

  // Put in nulls so we know what things were missing
  for (let id of idList) {
    x[id] = null;
  }

  for (let r of results.rows) {
    let obj = Object.assign({}, r);
    let id = obj[column];
    x[id] = obj;
  }

  if (opts.asList) {
    let list = [];
    for (let id of idList) {
      list.push(x[id]);
    }
    return list;
  }

  return x;
}

function objectsFromResults(results, key) {
  let x = {};
  for (let r of results.rows) {
    let obj = Object.assign({}, r);
    let id = obj[key];
    x[id] = obj;
  }
  return x;
}

function oneObjectFromResults(results, opts) {
  if (opts.assertExactlyOne) {
    assert.equal(results.rowCount, 1);
  } else {
    if (!results.rowCount) {
      return null;
    }
  }
  let obj = Object.assign({}, results.rows[0]);
  return obj;
}

function objectsListFromResults(results) {
  let x = [];
  for (let r of results.rows) {
    let obj = Object.assign({}, r);
    x.push(obj);
  }
  return x;
}

async function getObjectAsync(id, table, opts) {
  table = table || id.replace(/:.*$/, '');
  let x = await multigetObjectsAsync([id], table, opts);
  return x[id];
}

async function objectExistsAsync(id, table, column) {
  table = table || id.replace(/:.*$/, '');
  column = column || table + 'Id';
  let results = await db.queryAsync(
    'SELECT 1 FROM ' + js(table) + ' WHERE ' + js(column) + ' = $1',
    [id]
  );
  return results.rowCount > 0;
}

async function writeNewObjectAsync(obj, table, opts) {
  let o = { ...obj };
  let t = new Date();
  opts = opts || {};
  let column = opts.column || table + 'Id';
  if (opts.autoId) {
    if (!o[column]) {
      o[column] = idlib.createId(table, opts.autoIdSource || o.name);
    }
  }
  let id = o[column];
  o.updatedTime = o.updatedTime || t;
  o.createdTime = o.createdTime || t;

  // TODO(ccheever): Add ON CONFLICT stuff to handle UPSERTs

  let complete = false;
  while (!complete) {
    try {
      let keys = Object.keys(o);
      let fields = keys.map(js).join(', ');
      let values = [];
      for (let k of keys) {
        values.push(o[k]);
      }
      let verb = 'INSERT';

      await db.queryAsync(
        verb +
          ' INTO ' +
          js(table) +
          '(' +
          fields +
          ') VALUES (' +
          keys.map((_, n) => '$' + (n + 1)).join(', ') +
          ')',
        values
      );
      complete = true;
    } catch (e) {
      // If unique_violation (duplicate primary key)
      if (e.code === '23505') {
        if (opts.autoId) {
          o[column] = id + '+' + idlib.makeUuid(12);
        }
      } else {
        throw e;
      }
    }
  }
  return o;
}

async function updateObjectAsync(id, table, update, opts) {
  let o = { ...update };
  opts = opts || {};
  let column = opts.column || table + 'Id';
  o.updatedTime = o.updatedTime || new Date();
  delete o[column];
  let keys = Object.keys(o);
  let values = [];
  for (let k of keys) {
    values.push(o[k]);
  }
  let updates = keys.map((k, n) => js(k) + ' = $' + (n + 1)).join(', ');
  let q =
    'UPDATE ' +
    js(table) +
    ' SET ' +
    updates +
    ' WHERE ' +
    js(column) +
    ' = $' +
    (keys.length + 1) +
    ';';
  values.push(id);
  let result = await db.queryAsync(q, values);
  assert.equal(result.rowCount, 1);
}

function _pgReplacer() {
  let values = [];
  let r = (val) => {
    values.push(val);
    return '$' + values.length;
  };
  r.values = () => {
    return values;
  };
  return r;
}

async function _deleteObjectAsync(id, table, opts) {
  let column = opts.column || table + 'Id';
  let r = _pgReplacer();
  let result = await db.queryAsync(
    'DELETE FROM ' + js(table) + ' WHERE ' + js(column) + ' = ' + r(id) + ';',
    r.values()
  );
  return result.rowCount;
}

module.exports = {
  getObjectAsync,
  multigetObjectsAsync,
  writeNewObjectAsync,
  updateObjectAsync,
  objectsFromResults,
  objectsListFromResults,
  objectExistsAsync,
  oneObjectFromResults,
  _pgReplacer,
  _deleteObjectAsync,
};
