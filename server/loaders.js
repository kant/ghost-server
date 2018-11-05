let DataLoader = require('dataloader');

let data = require('./data');
let db = require('./db');
let model = require('./model');

function createLoaders(context) {
  // `user` and `userByUsername` are slightly more complicated
  // implementations here because we use the `prime` method
  // to make it so if you load a user via one loader, you don't
  // have to load it again via the other one.
  // See: https://github.com/facebook/dataloader#loading-by-alternative-keys
  let user = new DataLoader(async (keys) => {
    let users = await loadUsersAsync(keys);
    for (let user of users) {
      if (user) {
        context.loaders.userByUsername.prime(user.username, user);
      }
    }
    return users;
  });

  let userByUsername = new DataLoader(async (keys) => {
    let users = await loadUsersByUsernameAsync(keys);
    for (let user of users) {
      context.loaders.user.prime(user.userId, user);
    }
    return users;
  });

  let mediaByMediaUrl = new DataLoader(async (keys) => {
    let mediaItems = await loadMediaByMediaUrlAsync(keys);
    for (let media of mediaItems) {
      if (media) {
        context.loaders.media.prime(media.mediaId, media);
      }
    }
    return mediaItems;
  });

  let media = new DataLoader(async (keys) => {
    return await loadMediaAsync(keys);
  });

  let playlist = new DataLoader(async (keys) => {
    return await loadPlaylistsAsync(keys);
  });

  let tool = new DataLoader(async (keys) => {
    return await loadToolsAsync(keys);
  });

  let subscriptions = new DataLoader(async (keys) => {
    return await loadSubscriptionsAsync(keys, context);
  });

  let subscribers = new DataLoader(async (keys) => {
    return await loadSubscribersAsync(keys, context);
  });

  let subscriptionCount = new DataLoader(async (keys) => {
    return await loadSubscriptionCountsAsync(keys);
  });

  let subscriberCount = new DataLoader(async (keys) => {
    return await loadSubscriberCountsAsync(keys);
  });

  let mediaForUser = new DataLoader(async (keys) => {
    return await loadMediaIdsForUserIdsAsync(keys);
  });

  let playlistsForUser = new DataLoader(async (keys) => {
    return await loadPlaylistIdsForUserIdsAsync(keys);
  });

  let file = new DataLoader(async (keys) => {
    return await loadFileInfoAsync(keys);
  });

  let sessionInfo = new DataLoader(async (keys) => {
    return await loadSessionInfoAsync(keys);
  });

  let email = new DataLoader(async (keys) => {
    return await loadEmailAsync(keys);
  });

  let phone = new DataLoader(async (keys) => {
    return await loadPhoneAsync(keys);
  });

  let userplay = new DataLoader(async (keys) => {
    return await loadUserplayAsync(keys);
  });

  return {
    user,
    userByUsername,
    file,
    media,
    mediaForUser,
    mediaByMediaUrl,
    playlist,
    playlistsForUser,
    tool,
    sessionInfo,
    subscriptions,
    subscribers,
    subscriptionCount,
    subscriberCount,
    email,
    phone,
    userplay,
  };
}

function _orderedListFromResults(results, keys, column, fn) {
  fn = fn || ((x) => x);
  let byKey = {};
  for (let row of results.rows) {
    byKey[row[column]] = fn(row);
  }
  let loadList = [];
  for (let key of keys) {
    loadList.push(byKey[key]);
  }
  return loadList;
}

async function loadPlaylistsAsync(playlistIdList) {
  return await data.loadObjectsAsync(playlistIdList, 'playlist');
}

async function loadUsersAsync(userIdList) {
  return await data.loadObjectsAsync(userIdList, 'user', 'userId');
}

async function loadUsersByUsernameAsync(usernameList) {
  let r = db.replacer();
  let results = await db.queryAsync(
    `SELECT * FROM "user" WHERE "username" IN ${r.inList(usernameList)};`,
    r.values()
  );
  return _orderedListFromResults(results, usernameList, 'username');
}

async function loadMediaByMediaUrlAsync(mediaUrlList) {
  let r = db.replacer();
  let results = await db.queryAsync(
    /* SQL */
    `SELECT ${data.quoteColumnIdentifiers(
      model.mediaColumns
    )} FROM "media" WHERE "mediaUrl" IN ${r.inList(mediaUrlList)};`,
    r.values()
  );
  return _orderedListFromResults(results, mediaUrlList, 'mediaUrl');
}

async function loadToolsAsync(toolIdList) {
  return await data.loadObjectsAsync(toolIdList, 'tool', 'toolId');
}

async function loadMediaAsync(mediaIdList) {
  let mediaObjects = await data.loadObjectsAsync(mediaIdList, 'media', 'mediaId', {
    columns: model.mediaColumns,
  });

  return mediaObjects;

  // Don't use filter because we don't want to remove the items, just replace them
  // with nulls
  for (let i = 0; i < mediaIdList.length; i++) {
    let media = mediaObjects[i];
    if (media && (media.deleted || !media.usesGhost)) {
      mediaObjects[i] = null;
    }
  }

  return mediaObjects;
}

async function loadMediaIdsForUserIdsAsync(userIdList) {
  let r = db.replacer();
  let results = await db.queryAsync(
    /* SQL */ `
  SELECT "mediaId", "userId" FROM "media" WHERE "userId" IN ${r.inList(userIdList)};
  `,
    r.values()
  );
  let byUserId = {};
  for (let row of results.rows) {
    byUserId[row.userId] = byUserId[row.userId] || [];
    byUserId[row.userId].push(row.mediaId);
  }
  let ordered = [];
  for (let userId of userIdList) {
    ordered.push(byUserId[userId] || []);
  }
  return ordered;
}

async function loadPlaylistIdsForUserIdsAsync(userIdList) {
  let r = db.replacer();
  let results = await db.queryAsync(
    /* SQL */ `
    SELECT "playlistId", "userId" FROM "playlist" WHERE "userId" IN ${r.inList(userIdList)}
    ORDER BY "updatedTime" DESC;
    `,
    r.values()
  );
  let byUserId = {};
  for (let row of results.rows) {
    byUserId[row.userId] = byUserId[row.userId] || [];
    byUserId[row.userId].push(row.playlistId);
  }
  let ordered = [];
  for (let userId of userIdList) {
    ordered.push(byUserId[userId] || []);
  }
  return ordered;
}

async function loadSubscriberCountsAsync(toIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "toId", COUNT(1) AS "count" FROM "sub" 
  WHERE "toId" IN ${r.inList(toIdList)}
  GROUP BY "toId";`;
  let result = await db.queryAsync(q, r.values());
  let counts = {};
  for (let row of result.rows) {
    counts[row.toId] = row.count;
  }
  let loadList = [];
  for (let toId of toIdList) {
    loadList.push(counts[toId]);
  }
  return loadList;
}

async function loadSubscriptionCountsAsync(fromIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "fromId", COUNT(1) AS "count" FROM "sub" 
  WHERE "fromId" IN ${r.inList(fromIdList)}
  GROUP BY "fromId";`;
  let result = await db.queryAsync(q, r.values());
  let counts = {};
  for (let row of result.rows) {
    counts[row.fromId] = row.count;
  }
  let loadList = [];
  for (let fromId of fromIdList) {
    loadList.push(counts[fromId]);
  }
  return loadList;
}

async function loadSubscribersAsync(toIdList, context) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "fromId", "toId" FROM "sub" WHERE "toId" IN (`;
  q += toIdList.map(r).join(', ');
  q += `) ORDER BY "updatedTime" DESC;`;
  let result = await db.queryAsync(q, r.values());
  let subscribers = {};
  for (let toId of toIdList) {
    subscribers[toId] = [];
  }
  for (let row of result.rows) {
    subscribers[row.toId].push(row.fromId);
  }
  let loadList = [];
  for (let toId of toIdList) {
    loadList.push(await context.loaders.user.loadMany(subscribers[toId]));
  }
  return loadList;
}

async function loadSubscriptionsAsync(fromIdList, context) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "fromId", "toId" FROM "sub" WHERE "fromId" IN (`;
  q += fromIdList.map(r).join(', ');
  q += `) ORDER BY "updatedTime" DESC;`;
  let result = await db.queryAsync(q, r.values());
  let subscriptions = {};
  for (let fromId of fromIdList) {
    subscriptions[fromId] = [];
  }
  for (let row of result.rows) {
    subscriptions[row.fromId].push(row.toId);
  }
  let loadList = [];
  for (let fromId of fromIdList) {
    loadList.push(await context.loaders.user.loadMany(subscriptions[fromId]));
  }
  return loadList;
}

async function loadFileInfoAsync(fileIdList) {
  let r = db.replacer();
  let q = /* SQL */ `SELECT * FROM "file" WHERE "fileId" IN ${r.inList(fileIdList)};`;
  let results = await db.queryAsync(q, r.values());
  return _orderedListFromResults(results, fileIdList, 'fileId');
}

async function loadSessionInfoAsync(clientIdList) {
  let r = db.replacer();
  let q = /* SQL */ `SELECT * FROM "session" WHERE "clientId" IN ${r.inList(clientIdList)};`;
  let results = await db.queryAsync(q, r.values());
  return _orderedListFromResults(results, clientIdList, 'clientId');
}

async function loadEmailAsync(userIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT * FROM "email" WHERE "userId" IN ${r.inList(userIdList)} 
  ORDER BY "commandeered" ASC, "isPrimary" DESC, "confirmed" DESC, "bouncing" ASC
  ;
  `;
  let result = await db.queryAsync(q, r.values());
  let byUserId = {};
  for (let row of result.rows) {
    byUserId[row.userId] = byUserId[row.userId] || [];
    byUserId[row.userId].push(row);
  }
  let results = [];
  for (let userId of userIdList) {
    results.push(byUserId[userId]);
  }
  return results;
}

async function loadPhoneAsync(userIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT * FROM "phone" WHERE "userId" IN ${r.inList(userIdList)}
  ORDER BY "commandeered" ASC, "isPrimary" DESC, "confirmed" DESC, "bouncing" ASC
  ;
  `;
  let result = await db.queryAsync(q, r.values());
  let byUserId = {};
  for (let row of result.rows) {
    byUserId[row.userId] = byUserId[row.userId] || [];
    byUserId[row.userId].push(row);
  }
  let results = [];
  for (let userId of userIdList) {
    results.push(byUserId[userId]);
  }
  return results;
}

async function loadUserplayAsync(userplayIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT * FROM "userplay" WHERE "userplayId" IN ${r.inList(userplayIdList)}
  `;
  let result = await r.queryAsync(q);
  return _orderedListFromResults(result, userplayIdList, 'userplayId');
}

module.exports = {
  createLoaders,
  loadMediaAsync,
  loadPlaylistsAsync,
  loadToolsAsync,
  loadUsersAsync,
  loadSubscriberCountsAsync,
  loadSubscriptionCountsAsync,
  loadSubscriptionsAsync,
  loadSubscribersAsync,
  loadMediaIdsForUserIdsAsync,
  loadPlaylistIdsForUserIdsAsync,
  loadSessionInfoAsync,
  loadEmailAsync,
  loadPhoneAsync,
};
