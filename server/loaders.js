let DataLoader = require('dataloader');

let data = require('./data');
let model = require('./model');

function createLoaders() {
  let user = new DataLoader(async (keys) => {
    return await model.loadUsersAsync(keys);
  });

  let media = new DataLoader(async (keys) => {
    return await model.loadMediaAsync(keys);
  });

  let playlist = new DataLoader(async (keys) => {
    return await model.loadPlaylistsAsync(keys);
  });

  let tool = new DataLoader(async (keys) => {
    return await model.loadToolsAsync(keys);
  });

  return {
    user,
    media,
    playlist,
    tool,
  };
}

module.exports = {
  createLoaders,
};
