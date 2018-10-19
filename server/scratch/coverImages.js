let db = require('../db');
let model = require('../model');
let data = require('../data');

async function setCoverImageForMediaAsync(mediaId, coverImageFileId) {
  let r = db.replacer();
  let result = await r.queryAsync(/* SQL */ `
    UPDATE "media" SET "coverImageFileId" = ${r(coverImageFileId)}
    WHERE "mediaId" = ${r(mediaId)}
  `);
  return result.rowCount;
}

async function setCoverImageForPlaylistAsync(playlistId, coverImageFileId) {
  let r = db.replacer();
  let result = await r.queryAsync(/* SQL */ `
    UPDATE "playlist" SET "coverImageFileId" = ${r(coverImageFileId)}
    WHERE "playlistId" = ${r(playlistId)}
  `);
  return result.rowCount;
}

module.exports = {
  setCoverImageForMediaAsync,
  setCoverImageForPlaylistAsync,
};
