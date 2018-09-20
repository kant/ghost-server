let db = require('../db');
let model = require('../model');

async function updateMediaAsync(media) {
  if (!media.userId) {
    let itchUsername = media.extraData.itch.itchUsername;
    if (itchUsername) {
      let userId = 'user:itch/' + media.extraData.itch.itchUsername;
      await model.updateMediaAsync({ mediaId: media.mediaId, userId });
    }
  }
}

async function updateGamesAsync(mediaItems) {
  for (let media of mediaItems) {
    await updateMediaAsync(media);
  }
}

async function mainAsync() {
  let mediaItems = await model.getAllMediaAsync();
  await updateGamesAsync(mediaItems);
}

if (require.main === module) {
  mainAsync();
}

module.exports = {
  mainAsync,
  updateGamesAsync,
  updateMediaAsync,
};
