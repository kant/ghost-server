let DataLoader = require('dataloader');

let data = require('./data');
let db = require('./db');
let model = require('./model');

function createLoaders(context) {
  let user = new DataLoader(async (keys) => {
    return await loadUsersAsync(keys);
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

  return {
    user,
    media,
    playlist,
    tool,
    subscriptions,
    subscribers,
    subscriptionCount,
    subscriberCount,
  };
}

async function loadPlaylistsAsync(playlistIdList) {
  return await data.loadObjectsAsync(playlistIdList, 'playlist');
}

async function loadUsersAsync(userIdList) {
  return await data.loadObjectsAsync(userIdList, 'user', 'userId');
}

async function loadToolsAsync(toolIdList) {
  return await data.loadObjectsAsync(toolIdList, 'tool', 'toolId');
}

async function loadMediaAsync(mediaIdList) {
  // This is a little hacky :/
  return await data.loadObjectsAsync(mediaIdList, 'media', 'mediaId', {
    columns: model.mediaColumns,
  });
}

async function loadSubscriberCountsAsync(toIdList) {
  let r = db.replacer();
  let q = /* SQL */ `
  SELECT "toId", COUNT(1) AS "count" FROM "sub" WHERE "toId" IN (`;
  q += toIdList.map(r).join(', ');
  q += `) GROUP BY "toId";`;
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
  SELECT "fromId", COUNT(1) AS "count" FROM "sub" WHERE "fromId" IN (`;
  q += fromIdList.map(r).join(', ');
  q += ') GROUP BY "fromId";';
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
};
