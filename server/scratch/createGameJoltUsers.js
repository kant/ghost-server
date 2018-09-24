let requestImageSize = require('request-image-size');

let db = require('../db');
let idlib = require('../idlib');
let model = require('../model');

let devs = require('./gamejolt-devs');

async function createGameJoltUsersAsync() {
  for (let d of devs) {
    try {
      let image = null;
      if (d.img_avatar) {
        let imageSize = await requestImageSize(d.img_avatar);
        image = {
          ...imageSize,
          url: d.img_avatar,
        };
      }
      await model.newUserAsync({
        userId: 'user:gamejolt+' + idlib.normalizeInfo(d.username),
        name: d.name,
        username: d.username,
        unclaimed: true,
        otherUsernames: JSON.stringify({
          gamejolt: d.username,
          twitter: d.twitter_username,
          twitch: d.twitch_name,
        }),
        links: JSON.stringify({
          website: d.web_site,
        }),
        photo: image,
      });
    } catch (e) {
      console.error('Error creating new user ' + d.username, e);
    }
  }
}

async function fixUsernamesAsync() {
    let results = await db.queryAsync(`select "userId", username, name from "user" where "userId" like 'user:gamejolt+%'`);
    for (let row of results.rows) {
        await model.updateUserAsync({
            userId: row.userId,
            username: idlib.normalizeInfo(row.username),
        });
    }
}

function ghostUsernameFromGameJoltUsername(username) {
    return idlib.normalizeInfo(username).replace('_', '-');
}





if (require.main === module) {
  createGameJoltUsersAsync();
}

module.exports = {
  createGameJoltUsersAsync,
  fixUsernamesAsync,
};
