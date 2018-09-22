let time = require('@expo/time');

let data = require('../data');
let db = require('../db');
let model = require('../model');

async function getMediaItemsAsync(playlistId) {
  playlistId = playlistId || 'playlist:ludum-dare-42';
  let playlist = await model.getPlaylistAsync(playlistId);
  return playlist.mediaItems;
}

async function getMediaNamesAsync() {
  let tk = time.start();
  let mediaItems = await getMediaItemsAsync();
  let r = db.replacer();
  let q = 'SELECT "mediaId", "name" FROM "media" WHERE "mediaId" IN (';
  for (let m of mediaItems) {
    q += r(m.mediaId) + ', ';
  }
  q += r('xxx-media:doesnt-exist-xxx');
  q += ');';
  let results = await db.queryAsync(q, r.values());
  time.end(tk, 'getMediaNamesAsync');
  return data.objectsFromResults(results);
}

async function getEverythingAsync() {
  let tk = time.start();
  let mediaItems = await getMediaItemsAsync();
  let results = await model.multigetMediaAsync(mediaItems, { asList: true });
  time.end(tk, 'getEverythingAsync');
  return results;
}

module.exports = {
  getMediaItemsAsync,
  getMediaNamesAsync,
  getEverythingAsync,
};
