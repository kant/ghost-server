let ClientError = require('./ClientError');
let data = require('./data');
let db = require('./db');
let idlib = require('./idlib');

async function newPlayRecordAsync(obj) {
  obj.playRecordId = obj.playRecordId || idlib.createId('playRecord');
  return await data.writeNewObjectAsync(obj, 'playRecord');
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
  return await data.writeNewObjectAsync(obj, 'media', { autoId: true });
}

async function updateMediaAsync(obj) {
  return await data.updateObjectAsync(obj.mediaId, 'media', obj, { column: 'mediaId' });
}

async function newToolAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'tool', { autoId: true });
}

async function updateToolAsync(obj) {
  return await data.updateObjectAsync(obj.toolId, 'tool', obj, { column: 'toolId' });
}

async function deleteToolAsync(toolId) {
  return await data._deleteObjectAsync(toolId, 'tool', { column: 'toolId' });
}

async function getAllToolsAsync() {
  let q = 'SELECT * FROM "tool"';
  let results = await db.queryAsync(q);
  return data.objectsFromResults(results, 'toolId');
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

async function getToolAsync(toolId) {
  return await data.getObjectAsync(toolId, 'tool', { column: 'toolId' });
}

async function loadToolsAsync(toolIdList) {
  return await data.loadObjectsAsync(toolIdList, 'tool', 'toolId');
}

async function newUserAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'user', {
    column: 'userId',
    autoId: true,
    autoIdSource: obj.username,
  });
}

async function getUserAsync(userId) {
  return await data.getObjectAsync(userId, 'user', { column: 'userId' });
}

async function multigetUsersAsync(userIdList, opts) {
  return await data.multigetObjectsAsync(userIdList, 'user', { column: 'userId', ...opts });
}

async function loadUsersAsync(userIdList) {
  return await data.loadObjectsAsync(userIdList, 'user', 'userId');
}

async function updateUserAsync(obj) {
  return await data.updateObjectAsync(obj.userId, 'user', obj, { column: 'userId' });
}

async function _deleteUserAsync(userId) {
  return await data._deleteObjectAsync(userId, 'user', { column: 'userId' });
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

async function getPlaylistAsync(playlistId) {
  return await data.getObjectAsync(playlistId, 'playlist', { column: 'playlistId' });
}

async function loadPlaylistsAsync(playlistIdList) {
  return await data.loadObjectsAsync(playlistIdList, 'playlist');
}

async function updatePlaylistAsync(obj) {
  return await data.updateObjectAsync(obj.playlistId, 'playlist', obj, { column: 'playlistId' });
}

async function deletePlaylistAsync(playlistId) {
  return await data.updateObjectAsync(
    playlistId,
    'playlist',
    { deleted: true },
    { column: 'playlistId' }
  );
}

async function getPlaylistsForUser(userId) {
  let results = await db.queryAsync(
    'SELECT * FROM "playlist" WHERE "userId" = $1 ORDER BY "updatedTime" DESC',
    [userId]
  );
  return data.objectsListFromResults(results);
}

async function newPlaylistAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'playlist', { column: 'playlistId', autoId: true });
}

async function isRoleOfTeamAsync(userId, teamId, role) {
  let r = db.replacer();
  let q = `
  SELECT (${db.iq(role)})::jsonb ? ${r(userId)} AS "onTeam"
  FROM "user" WHERE "userId" = ${r(teamId)} AND "isTeam" IS True;
  `;
  let results = await db.queryAsync(q, r.values());
  if (results.rowCount > 0) {
    return results.rows[0].onTeam;
  }
  return false;
}

async function isMemberOfTeamAsync(userId, teamId) {
  return await isRoleOfTeamAsync(userId, teamId, 'members');
}

async function isAdminOfTeamAsync(userId, teamId) {
  return await isRoleOfTeamAsync(userId, teamId, 'admins');
}

let mediaColumns = [
  'mediaId',
  'name',
  'mediaUrl',
  'homepageUrl',
  'coverImage',
  'description',
  'dimensions',
  'instructions',
  'userId',
  'toolId',
  // 'extraData',
  'tags',
  'slug',
  'published',
  'createdTime',
  'updatedTime',
];

async function multigetMediaAsync(mediaIdList, opts) {
  return await data.multigetObjectsAsync(mediaIdList, 'media', {
    column: 'mediaId',
    columns: mediaColumns,
    ...opts,
  });
}

async function loadMediaAsync(mediaIdList) {
  // This is a little hacky :/
  let mediaList = await data.loadObjectsAsync(mediaIdList, 'media', 'mediaId', {
    columns: mediaColumns,
  });
  for (let media of mediaList) {
    if (media.tags) {
      media.tags = Object.keys(media.tags);
    } else {
      media.tags = [];
    }
  }
  return mediaList;
}

async function getTeamsForUserAsync(userId) {
  // Should this get all admin and member teams or just member teams?

  let r = db.replacer();
  let results = await db.queryAsync(
    'SELECT * FROM "user" WHERE "roles" @> ' +
      r.json({ members: { [userId]: 1 } }) +
      ' OR "roles" @> ' +
      r.json({ admins: { [userId]: 1 } }) +
      ';',
    r.values()
  );
  return data.objectsListFromResults(results, 'userId');
}

async function _addTeamRolesAsync(teamId, userIdList, roles) {
  if (typeof userIdList === 'string') {
    userIdList = [userIdList];
  }

  return await data.addJsonbSetItemsAsync(teamId, 'user', roles, data.listToSet(userIdList));
}

async function addTeamMembersAsync(teamId, userIdList) {
  return await _addTeamRolesAsync(teamId, userIdList, 'members');
}

async function addTeamAdminsAsync(teamId, userIdList) {
  // If you are added as an admin, you have to be a member too
  return await _addTeamRolesAsync(teamId, userIdList, ['admins', 'members']);
}

async function _removeTeamRolesAsync(teamId, userIdList, roles) {
  if (typeof userIdList == 'string') {
    userIdList = [userIdList];
  }
  return await data.removeJsonbSetItemsAsync(teamId, 'user', roles, data.listToSet(userIdList));
}

async function removeTeamMembersAsync(teamId, userIdList) {
  // If you are removed as a member, you should be removed as an admin too
  return await _removeTeamRolesAsync(teamId, userIdList, ['members', 'admins']);
}

async function removeTeamAdminsAsync(teamId, userIdList) {
  return await _removeTeamRolesAsync(teamId, userIdList, 'admins');
}

async function startSessionAsync({ clientId, userId, createdIp }, opts) {
  let sessionId = idlib.makeOpaqueId('session');
  await data.writeNewObjectAsync(
    {
      userId,
      createdIp,
      clientId,
    },
    'session',
    {
      upsert: true,
      column: 'clientId',
      ...opts,
    }
  );
}

async function convertUserToTeamAsync(teamId, adminIdList) {
  if (typeof adminIdList === 'string') {
    adminIdList = [adminIdList];
  }
  if (!adminIdList) {
    console.warn('You probably want to add at least one admin if you are making a team!');
    adminIdList = [];
  }
  return await updateUserAsync({
    userId: teamId,
    isTeam: true,
    members: JSON.stringify(data.listToSet(adminIdList)),
    admins: JSON.stringify(data.listToSet(adminIdList)),
  });
}

async function convertTeamToUserAsync(teamId) {
  return await updateUserAsync({
    userId: teamId,
    isTeam: false,
    members: JSON.stringify({}),
    admins: JSON.stringify({}),
  });
}

async function endSessionAsync(clientId, opts) {
  return await data._deleteObjectAsync(clientId, 'session', { column: 'clientId', ...opts });
}

async function getUserIdForSessionAsync(clientId) {
  let result = await db.queryAsync('SELECT "userId" FROM "session" WHERE "clientId" = $1', [
    clientId,
  ]);
  if (result.rowCount > 0) {
    return result.rows[0].userId;
  } else {
    return null;
  }
}

async function signupAsync(userInfo) {
  let { username, name } = userInfo;
  try {
    let user = await newUserAsync(
      {
        username,
        name,
      },
      {
        autoId: true,
        autoIdSource: name,
      }
    );
    return user;
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'user_username_key') {
      throw ClientError("Username '" + username + "' is already taken", 'USERNAME_NOT_AVAILABLE');
    }
    throw e;
  }
}

async function deleteMediaAsync(mediaId) {
  return await data._deleteObjectAsync(mediaId, 'media', { column: 'mediaId' });
}

async function addMediaTagsAsync(mediaId, tagList) {
  return await data.addJsonbSetItemsAsync(mediaId, 'media', 'tags', data.listToSet(tagList));
}

async function removeMediaTagsAsync(mediaId, tagList) {
  return await data.removeJsonbSetItemsAsync(mediaId, 'media', 'tags', data.listToSet(tagList));
}

let jsonFields = {
  media: ['description', 'coverImage', 'instructions', 'dimensions', 'links'],
  tool: ['about', 'image'],
  user: ['about', 'photo'],
};

module.exports = {
  newPlayRecordAsync,
  getPlayRecordsAsync,
  updatePlayRecordAsync,
  getMediaAsync,
  getAllMediaAsync,
  newMediaAsync,
  updateMediaAsync,
  deleteMediaAsync,
  newToolAsync,
  updateToolAsync,
  deleteToolAsync,
  getAllToolsAsync,
  recordProfileView,
  getTotalProfileViews,
  getTotalMediaPlays,
  getToolAsync,
  loadToolsAsync,
  newUserAsync,
  updateUserAsync,
  getUserAsync,
  multigetUsersAsync,
  loadUsersAsync,
  getUserByUsernameAsync,
  _deleteUserAsync,
  getPlaylistAsync,
  getPlaylistsForUser,
  loadPlaylistsAsync,
  updatePlaylistAsync,
  deletePlaylistAsync,
  newPlaylistAsync,
  multigetMediaAsync,
  loadMediaAsync,
  getTeamsForUserAsync,
  _addTeamRolesAsync,
  addTeamAdminsAsync,
  addTeamMembersAsync,
  _removeTeamRolesAsync,
  removeTeamAdminsAsync,
  removeTeamMembersAsync,
  startSessionAsync,
  endSessionAsync,
  getUserIdForSessionAsync,
  signupAsync,
  isRoleOfTeamAsync,
  isMemberOfTeamAsync,
  isAdminOfTeamAsync,
  jsonFields,
  addMediaTagsAsync,
  removeMediaTagsAsync,
  convertUserToTeamAsync,
  convertTeamToUserAsync,
};
