let db = require('../db');
let data = require('../data');
let model = require('../model');

async function getMediaItemsAsync(playlistId) {
  playlistId = playlistId || 'playlist:ludum-dare-42';
  let playlist = await model.getPlaylistAsync(playlistId);
  let mediaItemsIds = playlist.mediaItems;
  let mediaItems = await model.multigetMediaAsync(mediaItemsIds, { asList: true });
  return mediaItems;
}

async function createItchPlaceholderUserAsync(username) {
  return await model.newUserAsync({
    userId: 'user:itch+' + username,
    name: username + ' on itch.io',
    username: username,
    unclaimed: true,
    links: JSON.stringify({
      itch: 'https://' + username + '.itch.io/',
      itchProfile: 'https://itch.io/profile/' + username,
      // TODO: LD profile
    }),
  });

}

async function createUserForMediaAsync(media) {
  if (media.userId && media.userId.startsWith('user:itch+')) {
    try {
      let itchUsername = media.extraData.itch.itchUsername;
      if (await model.getUserAsync(media.userId)) {
        console.log('User ' + media.userId + ' already exists');
      } else {
        await model.newUserAsync({
          userId: media.userId,
          name: itchUsername + ' on itch.io',
          username: itchUsername,
          unclaimed: true,
          links: JSON.stringify({
            itch: 'https://' + itchUsername + '.itch.io/',
            itchProfile: 'https://itch.io/profile/' + itchUsername,
            // TODO: LD profile
          }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function updateUsernamesAsync(userId) {
  let results = await db.queryAsync('SELECT * FROM "user" WHERE "userId" LIKE \'%itch+%\';');
  let userList = data.objectsListFromResults(results);
  for (let user of userList) {
    await model.updateUserAsync({
      userId: user.userId,
      username: user.userId.substr('user:itch+'.length),
    });
  }
}
async function mainAsync() {
  // let mediaItems = await getMediaItemsAsync();
  let mediaItems = await model.getAllMediaAsync();
  for (let media of mediaItems) {
    await createUserForMediaAsync(media);
  }
}

if (require.main === module) {
  mainAsync();
}

module.exports = {
  mainAsync,
  getMediaItemsAsync,
  createUserForMediaAsync,
  updateUsernamesAsync,
  createItchPlaceholderUserAsync,
};
