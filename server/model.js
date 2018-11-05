let assert = require('assert');

let ClientError = require('./ClientError');
let data = require('./data');
let db = require('./db');
let idlib = require('./idlib');
let validation = require('./validation');

async function newPlayRecordAsync(obj) {
  obj.playRecordId = obj.playRecordId || idlib.createId('playRecord');
  return await data.writeNewObjectAsync(obj, 'playRecord');
}

async function getEmailInfoAsync(userId, email) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  SELECT * FROM "email" WHERE "email" = ${r(email)} AND "userId" = ${r(userId)};
  `,
    r.values()
  );
  if (result.rowCount) {
    return { ...result.rows[0] };
  }
}

async function getPhoneNumberInfoAsync(userId, number) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  SELECT * FROM "phone" WHERE "number" = ${r(number)} AND "userId" = ${r(userId)};
  `,
    r.values()
  );
  if (result.rowCount) {
    return { ...result.rows[0] };
  }
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

async function ingestMediaAsync(mediaInput) {
  let media = data.stringifyJsonFields(mediaInput, jsonFields.media);
  if (media.tags) {
    await validation.validateTagListAsync(media.tags);
    media.tagSet = JSON.stringify(data.listToSet(media.tags));
    delete media.tags;
  }
  if (media.toolIds) {
    media.toolSet = JSON.stringify(data.listToSet(media.toolIds));
    delete media.toolIds;
  }
  if (media.slug) {
    await validation.validateSlugAsync(media.slug);
  }
  return media;
}

async function newMediaAsync(obj) {
  // TODO(ccheever): Possibly handle duplicate slug case more explicitly
  // rather than just letting the Postgres error bubble up
  let media = await ingestMediaAsync(obj);
  try {
    return await data.writeNewObjectAsync(media, 'media', { autoId: true });
  } catch (e) {
    if (e.code === '23505' && e.detail.startsWith('Key (slug)=')) {
      throw ClientError('Duplicate slug: ' + media.slug, 'DUPLICATE_SLUG');
    } else {
      throw e;
    }
  }
}

async function updateMediaAsync(obj) {
  // TODO(ccheever): We may want some way to update links
  // individually instead of only the whole set at once
  let media = await ingestMediaAsync(obj);
  console.log({ media });
  try {
    return await data.updateObjectAsync(media.mediaId, 'media', media, { column: 'mediaId' });
  } catch (e) {
    if (e.code === '23505' && e.detail.startsWith('Key (slug)=')) {
      throw ClientError('Duplicate slug: ' + media.slug, 'DUPLICATE_SLUG');
    } else {
      throw e;
    }
  }
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

async function ingestUserAsync(userInput) {
  let user = data.stringifyJsonFields(userInput, jsonFields.user);
  return user;
}

async function newUserAsync(userInput) {
  let userInput_ = await ingestUserAsync(userInput);
  return await data.writeNewObjectAsync(userInput_, 'user', {
    column: 'userId',
    autoId: true,
    autoIdSource: userInput_.username,
  });
}

async function getUserAsync(userId) {
  return await data.getObjectAsync(userId, 'user', { column: 'userId' });
}

async function multigetUsersAsync(userIdList, opts) {
  return await data.multigetObjectsAsync(userIdList, 'user', { column: 'userId', ...opts });
}

async function updateUserAsync(userInput) {
  assert(typeof userInput === 'object', '`userInput` must be an object');
  // If there's no data passed in, then just return
  if (Object.keys(userInput).length === 0) {
    return;
  }
  let obj = await ingestUserAsync(userInput);
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

async function ingestPlaylistAsync(playlistInput) {
  let obj = data.stringifyJsonFields(playlistInput, jsonFields.playlist);
  return obj;
}

async function updatePlaylistAsync(playlistInput) {
  let obj = await ingestPlaylistAsync(playlistInput);
  return await data.updateObjectAsync(obj.playlistId, 'playlist', obj, { column: 'playlistId' });
}

async function deletePlaylistAsync(playlistId) {
  return await data._deleteObjectAsync(playlistId, 'playlist', { column: 'playlistId' });
}

async function getPlaylistsForUser(userId) {
  let results = await db.queryAsync(
    'SELECT * FROM "playlist" WHERE "userId" = $1 ORDER BY "updatedTime" DESC',
    [userId]
  );
  return data.objectsListFromResults(results);
}

async function addPlaylistAsync(playlistInput) {
  let obj = await ingestPlaylistAsync(playlistInput);
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

async function getSessionsForUserAsync(userId) {
  let r = db.replacer();
  let results = await db.queryAsync(
    `SELECT "clientId", "createdIp", "updatedTime" 
    FROM "session" WHERE "userId" = ${r(userId)}
    ORDER BY "updatedTime" DESC;`,
    r.values()
  );
  return results.rows;
}

async function clearAllUserSessionsAsync(userId) {
  let r = db.replacer();
  let results = await db.queryAsync(
    `DELETE FROM "session" WHERE "userId" = ${r(userId)};`,
    r.values()
  );
  return results.rowCount;
}

async function _deleteUserAndDataAsync(userId) {
  await _deleteUserAsync(userId);
  let r;
  r = db.replacer();
  await db.queryAsync(
    /* SQL */ `
  DELETE FROM "session" WHERE "userId" = ${r(userId)};
  `,
    r.values()
  );
  r = db.replacer();
  await db.queryAsync(
    /* SQL */ `
  DELETE FROM "email" WHERE "userId" = ${r(userId)};
  `,
    r.values()
  );
  return true;
}

let mediaColumns = [
  'mediaId',
  'name',
  'mediaUrl',
  'homepageUrl',
  'sourceCodeUrl',
  'coverImage',
  'description',
  'dimensions',
  'instructions',
  'userId',
  // 'extraData',
  'links',
  'toolSet',
  'tagSet',
  'slug',
  'published',
  'deleted',
  'usesGhost',
  'coverImageFileId',
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

async function endAllSessionsForUserAsync(userId) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  DELETE FROM "session" WHERE "userId" = ${r(userId)};
  `,
    r.values()
  );
  return result.rowCount;
}

async function endAllSessionsForUserExceptAsync(userId, clientId) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  DELETE FROM "session" WHERE "userId" = ${r(userId)} AND "clientId" <> ${r(clientId)};
  `,
    r.values()
  );
  return result.rowCount;
}

// async function getUserIdForSessionAsync(clientId) {
//   let result = await db.queryAsync('SELECT "userId" FROM "session" WHERE "clientId" = $1', [
//     clientId,
//   ]);
//   if (result.rowCount > 0) {
//     return result.rows[0].userId;
//   } else {
//     return null;
//   }
// }

async function getUserIdForSessionAsync(clientId) {
  let [userId] = await userIdsForSessionsAsync([clientId]);
  return userId;
}

async function userIdsForSessionsAsync(clientIdList) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ ` 
  SELECT "userId", "clientId" FROM "session" WHERE "clientId" IN ${r.inList(clientIdList)};
  `,
    r.values()
  );
  let byClientId = {};
  for (let row of result.rows) {
    byClientId[row.clientId] = row.userId;
  }
  let userIdList = [];
  for (let clientId of clientIdList) {
    userIdList.push(byClientId[clientId]);
  }
  return userIdList;
}

async function signupAsync(userInput) {
  try {
    let user = await newUserAsync(userInput, {
      autoId: true,
      autoIdSource: userInput.name,
    });
    return user;
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'user_username_key') {
      throw ClientError(
        "Username '" + userInput.username + "' is already taken",
        'USERNAME_NOT_AVAILABLE'
      );
    }
    throw e;
  }
}

async function deleteMediaAsync(mediaId) {
  return await data._deleteObjectAsync(mediaId, 'media', { column: 'mediaId' });
}

async function addMediaTagsAsync(mediaId, tagList) {
  return await data.addJsonbSetItemsAsync(mediaId, 'media', 'tagSet', data.listToSet(tagList));
}

async function removeMediaTagsAsync(mediaId, tagList) {
  return await data.removeJsonbSetItemsAsync(mediaId, 'media', 'tagSet', data.listToSet(tagList));
}

async function addMediaToolsAsync(mediaId, toolIdList) {
  return await data.addJsonbSetItemsAsync(mediaId, 'media', 'toolSet', data.listToSet(toolIdList));
}

async function removeMediaToolsAsync(mediaId, toolIdList) {
  return await data.removeJsonbSetItemsAsync(
    mediaId,
    'media',
    'toolSet',
    data.listToSet(toolIdList)
  );
}

async function subscribeAsync(fromId, toId) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */
    `INSERT INTO "sub" ("fromId", "toId") 
    VALUES (${r(fromId)}, ${r(toId)}) 
    ON CONFLICT ON CONSTRAINT "sub_pkey" DO NOTHING;`,
    r.values()
  );
  return result.rowCount > 0;
}

async function unsubscribeAsync(fromId, toId) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  DELETE FROM "sub" WHERE 
  "fromId" = ${r(fromId)} AND
  "toId" = ${r(toId)};
  `,
    r.values()
  );
  return result.rowCount > 0;
}

async function subscribersAsync(toId) {
  let r = db.replacer();
  let result = await db.queryAsync(/* SQL */ `
  SELECT "fromId" FROM "sub" WHERE "toId" = ${r(toId)} ORDER BY "updatedTime" DESC;
  `);
  return result.rows.map((row) => row.fromId);
}

async function subscriptionsAsync(fromId) {
  let r = db.replacer();
  let result = await db.queryAsync(/* SQL */ `
  SELECT "toId" FROM "sub" WHERE "fromId" = ${r(fromId)} ORDER BY "updatedTime" DESC;
  `);
  return result.rows.map((row) => row.toId);
}

async function allMediaIdsAsync(opts) {
  return await data.getAllIdsAsync('media', { ignoreDeleted: true, ...opts });
}

async function allUserIdsAsync(opts) {
  return await data.getAllIdsAsync('user', opts);
}

async function allPlaylistIdsAsync(opts) {
  return await data.getAllIdsAsync('playlist', opts);
}

async function allToolIdsAsync(opts) {
  return await data.getAllIdsAsync('tool', opts);
}

let jsonFields = {
  media: ['description', 'coverImage', 'instructions', 'dimensions', 'links', 'toolSet'],
  tool: ['about', 'image'],
  user: ['about', 'photo', 'info'],
  playlist: ['description', 'mediaItems', 'image', 'metadata'],
};

async function getUploadedFileAsync(fileId) {
  let r = db.replacer();
  let results = await db.queryAsync(
    /* SQL */ `
  SELECT 
    "file"."fileId" AS "fileId",
    "file"."hash" AS "hash",
    "file"."name" AS "filename",
    "file"."encoding" AS "encoding",
    "file"."mimeType" AS "mimeType",
    "file"."userId" AS "userId",
    "blob"."data" AS "data",
    "blob"."size" AS "size",
    "file"."uploadedTime" AS "uploadedTime"
  FROM "file" JOIN "blob" ON "file"."hash" = "blob"."hash" 
  WHERE "file"."fileId" = ${r(fileId)};
  `,
    r.values()
  );
  if (results.rowCount > 0) {
    let file = { ...results.rows[0] };
    return file;
  } else {
    return null;
  }
}

async function getUserIdForEmailAsync(email, opts) {
  opts = opts || {};
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "userId" FROM "email" WHERE "email" = ${r(email)} AND NOT "commandeered"
  `;
  if (opts.requireConfirmed) {
    q += `AND "confirmed" `;
  }
  q += `ORDER BY "confirmed" DESC, "isPrimary" DESC`;
  let result = await db.queryAsync(q + ';', r.values());
  if (result.rowCount > 0) {
    return result.rows[0].userId;
  }
}

async function getUserIdForPhoneNumberAsync(number, opts) {
  opts = opts || {};
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "userId" FROM "phone" WHERE "number" = ${r(number)} AND NOT "commandeered"
  `;
  if (opts.requireConfirmed) {
    q += `AND "confirmed" `;
  }
  q += `ORDER BY "confirmed" DESC, "isPrimary" DESC`;
  let result = await db.queryAsync(q + ';', r.values());
  if (result.rowCount > 0) {
    return result.rows[0].userId;
  }
}

async function addPlaylistMediaItemsAsync(playlistId, mediaItemIds, opts) {
  let itemsAdded = [];
  let itemsErrored = [];

  for (let mediaItemId of mediaItemIds) {
    try {
      let itemAdded = await addPlaylistMediaItemAsync(playlistId, mediaItemId, opts);
      if (itemAdded) {
        itemsAdded.push(itemAdded);
      } else {
        itemsErrored.push([mediaItemId, 'probably already added?']);
      }
    } catch (e) {
      console.error(e);
      itemsErrored.push([mediaItemId, e]);
    }
  }
  return { itemsAdded, itemsErrored };
}

async function addPlaylistMediaItemAsync(playlistId, mediaId, opts) {
  let r = db.replacer();
  opts = opts || {};
  let q;
  if (opts.toBeginning) {
    q = /* SQL */ `
  UPDATE "playlist" SET "mediaItems" = ${r(JSON.stringify([mediaId]))}::jsonb || "mediaItems"
  WHERE "playlistId" = ${r(playlistId)};
  `;
  } else {
    q = /* SQL */ `
  UPDATE "playlist" SET "mediaItems" = "mediaItems" || ${r(JSON.stringify([mediaId]))}::jsonb 
  WHERE "playlistId" = ${r(playlistId)};
  `;
  }
  let result = await db.queryAsync(q, r.values());
  return result.rowCount === 1;
}

async function removePlaylistMediaItemAsync(playlistId, mediaId) {
  let r = db.replacer();
  let q = /* SQL */ `
  UPDATE "playlist" SET "mediaItems" = "mediaItems" - ${r(mediaId)}
  WHERE "playlistId" = ${r(playlistId)};
  `;
  let result = await db.queryAsync(q, r.values());
  return result.rowCount === 1;
}

async function recordUserplayStartAsync(clientId, userId, userplayId, mediaId, mediaUrl) {
  let r = db.replacer();
  let result = await r.queryAsync(/* SQL */ `
  INSERT INTO "userplay" (
    "userplayId",
    "clientId",
    "userId",
    "mediaId",
    "mediaUrl",
    "startTime",
    "endTime"
  ) VALUES (
    ${r(userplayId)},
    ${r(clientId)},
    ${r(userId)},
    ${r(mediaId)},
    ${r(mediaUrl)},
    NOW(),
    NULL
  );
  `);
  // TODO: Maybe make this idempotent, or otherwise handle conflicts? maybe?
  return result.rowCount === 1;
}

async function recordUserplayEndAsync(clientId, userId, userplayId) {
  let r = db.replacer();
  let result = await r.queryAsync(/* SQL */ `
  UPDATE "userplay" SET "endTime" = NOW() WHERE 
    "userplayId" = ${r(userplayId)} AND
    "clientId" = ${r(clientId)} AND
    "userId" = ${r(userId)}
  ;
  `);
  return result.rowCount === 1;
}

module.exports = {
  newPlayRecordAsync,
  getPlayRecordsAsync,
  updatePlayRecordAsync,
  getMediaAsync,
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
  newUserAsync,
  updateUserAsync,
  getUserAsync,
  ingestUserAsync,
  multigetUsersAsync,
  getUserByUsernameAsync,
  _deleteUserAsync,
  getPlaylistAsync,
  getPlaylistsForUser,
  updatePlaylistAsync,
  deletePlaylistAsync,
  ingestMediaAsync,
  addPlaylistAsync,
  multigetMediaAsync,
  getTeamsForUserAsync,
  _addTeamRolesAsync,
  addTeamAdminsAsync,
  addTeamMembersAsync,
  _removeTeamRolesAsync,
  removeTeamAdminsAsync,
  removeTeamMembersAsync,
  startSessionAsync,
  endSessionAsync,
  endAllSessionsForUserAsync,
  endAllSessionsForUserExceptAsync,
  getUserIdForSessionAsync,
  userIdsForSessionsAsync,
  signupAsync,
  isRoleOfTeamAsync,
  isMemberOfTeamAsync,
  isAdminOfTeamAsync,
  jsonFields,
  addMediaTagsAsync,
  removeMediaTagsAsync,
  addMediaToolsAsync,
  removeMediaToolsAsync,
  convertUserToTeamAsync,
  convertTeamToUserAsync,
  getSessionsForUserAsync,
  clearAllUserSessionsAsync,
  allMediaIdsAsync,
  allPlaylistIdsAsync,
  allUserIdsAsync,
  allToolIdsAsync,
  subscribeAsync,
  unsubscribeAsync,
  subscribersAsync,
  subscriptionsAsync,
  getUploadedFileAsync,
  mediaColumns,
  getEmailInfoAsync,
  getPhoneNumberInfoAsync,
  getUserIdForEmailAsync,
  getUserIdForPhoneNumberAsync,
  addPlaylistMediaItemsAsync,
  addPlaylistMediaItemAsync,
  removePlaylistMediaItemAsync,
  _deleteUserAndDataAsync,
  recordUserplayStartAsync,
  recordUserplayEndAsync,
};
