let data = require('./data');
let db = require('./db');
let id = require('./id');

async function newPlayRecordAsync(obj) {
  obj.playRecordId = obj.playRecordId || id.createId('pr');
  return await data.writeNewObjectAsync(obj, 'playRecord');
}

async function writeGhostSignupAsync(resultData) {
  let userId = resultData.data.user.id;
  let signupEmail = resultData.data.user.email;
  let signupTime = resultData.data.user.created_at;
  let signupUsername = resultData.data.user.username;
  await db.queryAsync(
    `
    INSERT INTO "ghostSignups" ( 
      "signupTime",
      "userId",
      "signupUsername",
      "signupEmail"
    ) VALUES ($1, $2, $3, $4)`,
    [signupTime, userId, signupUsername, signupEmail]
  );
}

async function getPlayRecordsAsync(mediaId, opts) {
  opts = opts || {}; // userId, sortBy
  let limit = opts.limit || 30;
  let n = 0;
  let q = 'SELECT * FROM "playRecord" WHERE "mediaId" = $' + ++n;
  let params = [mediaId];
  if (opts.userId) {
    q += ' AND "userId" = $' + ++n;
    params.push(opts.userId);
  }
  let sortBy = opts.sortBy || 'score';
  q += ' ORDER BY ' + JSON.stringify(sortBy) + ' DESC LIMIT $' + ++n;
  params.push(limit);
  let results = await db.queryAsync(q, params);
  return data.objectsListFromResults(results);
}

async function updatePlayRecordAsync(obj) {
  return await data.updateObjectAsync(obj.playRecordId, 'playRecord', obj, {
    column: 'playRecordId',
  });
}

async function getMediaAsync(mediaId) {
  return await data.getObjectAsync(mediaId, 'media');
}

async function getAllMediaAsync() {
  let q = 'SELECT * FROM "media" ORDER BY "updatedTime" DESC';
  let results = await db.queryAsync(q);
  return data.objectsListFromResults(results);
}

async function newMediaAsync(obj) {
  obj.mediaId =
    obj.mediaId ||
    (await id.createUniqueIdAsync('media', obj.name, async (mediaId) => {
      return data.objectExistsAsync(mediaId, 'media', 'mediaId');
    }));
  return await data.writeNewObjectAsync(obj, 'media');
}

async function updateMediaAsync(obj) {
  return await data.updateObjectAsync(obj.mediaId, 'media', obj, { column: 'mediaId' });
}

async function newEngineAsync(obj) {
  obj.engineId =
    obj.engineId ||
    (await id.createUniqueIdAsync('engine', obj.name, async (engineId) => {
      return data.objectExistsAsync(engineId, 'engine', 'engineId');
    }));
  return await data.writeNewObjectAsync(obj, 'engine');
}

async function updateEngineAsync(obj) {
  return await data.updateObjectAsync(obj, 'engine', { column: 'engineId' });
}

async function getAllEnginesAsync() {
  let q = 'SELECT * FROM "engine"';
  let results = await db.queryAsync(q);
  return data.objectsFromResults(results, 'engineId');
}

async function recordProfileView(viewingUserId, viewedUserId, when) {
  when = when || new Date();
  let result = await db.queryAsync(
    'INSERT INTO "profileView" ("viewedProfileUserId", "viewerUserId", "viewTime") VALUES ($1, $2, $3);',
    [viewedUserId, viewingUserId, when]
  );
  assert.equal(result.rowCount, 1);
}

async function getTotalProfileViews(userId) {
  let result = await db.queryAsync(
    'SELECT COUNT(1)::integer AS "views" FROM "profileView" WHERE "viewedProfileUserId" = $1',
    [userId]
  );
  return result.rows[0].views;
}

async function getTotalMediaPlays(mediaId) {
  let result = await db.queryAsync(
    'SELECT COUNT(1)::integer AS "views" FROM "playRecord" WHERE "mediaId" = $1',
    [mediaId]
  );
  return result.rows[0].views;
}

async function getEngineAsync(engineId) {
  return await data.getObjectAsync(engineId, 'engine', { column: 'engineId' });
}

async function newUserAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'user', { column: 'userId' });
}

async function getUserAsync(userId) {
  return await data.getObjectAsync(userId, 'user', { column: 'userId' });
}

async function updateUserAsync(obj) {
  return await data.updateObjectAsync(obj.userId, 'user', obj, { column: 'userId' });
}

async function getUserByUsernameAsync(username) {
  let results = await db.queryAsync('SELECT * FROM "user" WHERE "username" = $1;', [username]);
  if (results.rowCount > 0) {
    if (results.rowCount > 1) {
      console.warn("Multiple users with username '" + username + "'");
    }
    let objs = data.objectsListFromResults(results);
    return objs[0];
  }
}

module.exports = {
  writeGhostSignupAsync,
  newPlayRecordAsync,
  getPlayRecordsAsync,
  updatePlayRecordAsync,
  getMediaAsync,
  getAllMediaAsync,
  newMediaAsync,
  updateMediaAsync,
  newEngineAsync,
  updateEngineAsync,
  getAllEnginesAsync,
  recordProfileView,
  getTotalProfileViews,
  getTotalMediaPlays,
  getEngineAsync,
  newUserAsync,
  updateUserAsync,
  getUserAsync,
  getUserByUsernameAsync,
};
