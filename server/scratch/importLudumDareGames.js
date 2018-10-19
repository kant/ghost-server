let requestImageSize = require('request-image-size');

//let itches = require('./itches42b.json');
let model = require('../model');
let test = require('./test');

async function importGamesAsync(data) {
  let a = [];
  let errors = [];
  for (let game of data) {
    // a.push(importGameAsync(game));
    try {
      await importGameAsync(game);
    } catch (e) {
      errors.push(e);
    }
  }
  console.error({ errors });
  // await Promise.all(a);
}

async function updatePublishedFieldAsync(game) {
  if (game && game.extraData && game.extraData.itch && game.extraData.itch.ld.published) {
    return await model.updateMediaAsync({
      mediaId: game.mediaId,
      published: game.extraData.itch.ld.published,
    });
  } else {
    console.warn('No published date available');
  }
}

async function updateAllPublishedFieldsAsync() {
  let allMedia = await model.getAllMediaAsync();
  for (let media of allMedia) {
    // await updatePublishedFieldAsync(media);
    updatePublishedFieldAsync(media);
  }
}

async function importGameAsync(game) {
  let media = {
    name: game.name,
    mediaUrl: 'https:' + game.itchEmbedUrl,
    homepageUrl: game.itchUrl,
    extraData: JSON.stringify({ itch: game }),
    engineId: 'engine:unity',
    userId: 'user:itch:' + game.itchUsername,
  };
  if (game.coverImage) {
    let data = await requestImageSize(game.coverImage);
    let coverImage = Object.assign({ url: game.coverImage }, data);
    media.coverImage = JSON.stringify(coverImage);
  }

  if (game.ld.body) {
    Object.assign(media, {
      description: JSON.stringify({
        markdown: { content: game.ld.body, root: 'https://ldjam.com' + game.ld.path },
      }),
    });
  }

  if (game.instructionsMarkdown) {
    media.instructions = JSON.stringify({
      markdown: { content: game.instructionsMarkdown, root: game.itchUrl },
    });
  }

  await model.newMediaAsync(media);
}

if (require.main === module) {
  importGamesAsync(itches);
}

module.exports = {
  importGamesAsync,
  importGameAsync,
  updatePublishedFieldAsync,
  updateAllPublishedFieldsAsync,
};
