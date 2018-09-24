let assert = require('assert');

let db = require('./db');
let idlib = require('./idlib');

async function multigetObjectsAsync(idList, table, opts) {
  opts = opts || {};
  let column = opts.column || table + 'Id';
  let selectColumns = '*';
  if (opts.columns) {
    selectColumns = quoteColumnIdentifiers(opts.columns);
  }
  let results = await db.queryAsync(
    'SELECT ' +
      selectColumns +
      ' FROM ' +
      db.iq(table) +
      ' WHERE ' +
      db.iq(column) +
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

async function loadObjectsAsync(idList, table, column, opts) {
  column = column || table + 'Id';
  return await multigetObjectsAsync(idList, table, { column: column, ...opts, asList: true });
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

async function writeNewObjectAsync(obj, table, opts) {
  let o = { ...obj };
  opts = opts || {};
  let column = opts.column || table + 'Id';
  if (opts.autoId) {
    if (!o[column]) {
      o[column] = idlib.createId(table, opts.autoIdSource || o.name);
    }
  }
  let id = o[column];

  let complete = false;
  while (!complete) {
    try {
      let keys = Object.keys(o);
      let fields = keys.map(db.iq).join(', ');
      let verb = 'INSERT';

      let r = db.replacer();

      let query =
        verb +
        ' INTO ' +
        db.iq(table) +
        ' (' +
        fields +
        ') VALUES (' +
        keys.map((k) => r(o[k])).join(', ') +
        ')';

      if (opts.upsert) {
        if (opts.autoId) {
          throw new Error(
            "Can't use `autoId` and `upsert` options together in `writeNewObjectAsync`"
          );
        }
        query += ' ON CONFLICT (' + db.iq(column) + ') DO UPDATE SET ';
        let sets = [];
        for (let key in o) {
          let val = o[key];
          sets.push(db.iq(key) + ' = ' + r(val));
        }
        query += sets.join(', ');
      }

      query += ';';

      await db.queryAsync(query, r.values());

      complete = true;
    } catch (e) {
      // If unique_violation (duplicate primary key)
      if (e.code === '23505' && e.constraint.endsWith('_pkey')) {
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
  delete o[column];
  let keys = Object.keys(o);
  let r = db.replacer();
  let updates = keys.map((k) => db.iq(k) + ' = ' + r(o[k])).join(', ');
  let q =
    'UPDATE ' + db.iq(table) + ' SET ' + updates + ' WHERE ' + db.iq(column) + ' = ' + r(id) + ';';
  let result = await db.queryAsync(q, r.values());
  assert.equal(result.rowCount, 1);
}

async function _deleteObjectAsync(id, table, opts) {
  let column = opts.column || table + 'Id';
  let r = db.replacer();
  let result = await db.queryAsync(
    'DELETE FROM ' + db.iq(table) + ' WHERE ' + db.iq(column) + ' = ' + r(id) + ';',
    r.values()
  );
  return result.rowCount;
}

async function addJsonbSetItemsAsync(id, table, fields, setToAdd, opts) {
  opts = opts || {};
  let column = opts.column || table + 'Id';
  if (typeof fields === 'string') {
    fields = [fields];
  }

  let r = db.replacer();

  let q = `
  UPDATE ${db.iq(table)} SET `;
  q += fields
    .map(
      (field) => `${db.iq(field)} = (
    CASE
        WHEN ${db.iq(field)} IS null THEN '{}'::jsonb
        ELSE ${db.iq(field)}
    END
) || ${r(JSON.stringify(setToAdd))}::jsonb `
    )
    .join(', ');

  q += ` WHERE ${db.iq(column)} = ${r(id)};`;

  let result = await db.queryAsync(q, r.values());
  return result.rowCount;
}

async function removeJsonbSetItemsAsync(id, table, fields, setToRemove, opts) {
  opts = opts || {};
  let column = opts.column || table + 'Id';
  if (typeof fields === 'string') {
    fields = [fields];
  }
  let r = db.replacer();
  let q = 'UPDATE ' + db.iq(table) + ' SET ';
  let commaBefore = '';
  for (let field of fields) {
    q += commaBefore;
    q += db.iq(field) + ' = ' + db.iq(field);
    for (let value in setToRemove) {
      q += ' - ' + r(value);
    }
    commaBefore = ', ';
  }
  q += ' WHERE ' + db.iq(column) + ' = ' + r(id) + ';';
  let result = await db.queryAsync(q, r.values());
  return result.rowCount;
}

function quoteColumnIdentifiers(columns) {
  return columns.map(db.iq).join(', ');
}

function stringifyJsonFields(obj, jsonFields) {
  let obj_ = { ...obj };
  for (let field of jsonFields) {
    if (obj_.hasOwnProperty(field)) {
      obj_[field] = JSON.stringify(obj_[field]);
    }
  }
  return obj_;
}

function listToSet(list) {
  let s = {};
  for (let item of list) {
    s[item] = 1;
  }
  return s;
}

function combinePluralAndSingular(list, item) {
  let x = [];
  if (list) {
    x = list.slice(0);
  }
  if (item) {
    x.push(item);
  }
  return x;
}


module.exports = {
  getObjectAsync,
  multigetObjectsAsync,
  loadObjectsAsync,
  writeNewObjectAsync,
  updateObjectAsync,
  objectsFromResults,
  objectsListFromResults,
  _deleteObjectAsync,
  quoteColumnIdentifiers,
  stringifyJsonFields,
  listToSet,
  addJsonbSetItemsAsync,
  removeJsonbSetItemsAsync,
  combinePluralAndSingular,
};
