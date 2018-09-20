let ClientError = require('./ClientError');
let model = require('./model');

class Api {
  async addAsync(...args) {
    let sum = 0;
    for (let x of args) {
      sum += x;
    }
    return sum;
  }

  async getCurrentJamPlaylistAsync(playlistId) {
    playlistId = playlistId || 'playlist:ludum-dare-42';
    let playlist = await model.getPlaylistAsync(playlistId);
    let mediaItems = await model.multigetMediaAsync(playlist.mediaItems, { asList: true });
    playlist.mediaItems = mediaItems;
    return playlist;
  }

  async newPlayRecordAsync(obj) {
    return await model.newPlayRecordAsync(obj);
  }

  async getPlayRecordsAsync(mediaId, opts) {
    return await model.getPlayRecordsAsync(mediaId, opts);
  }

  async getMediaAsync(mediaId) {
    return await model.getMediaAsync(mediaId);
  }

  async getAllMediaAsync() {
    return await model.getAllMediaAsync();
  }

  async updateMediaAsync(obj) {
    return await model.updateMediaAsync(obj);
  }

  async newMediaAsync(obj) {
    return await model.newMediaAsync(obj);
  }

  async newEngineAsync(obj) {
    return await model.newEngineAsync(obj);
  }

  async updateEngineAsync(obj) {
    return await model.updateEngineAsync(obj);
  }

  async getAllEnginesAsync() {
    return await model.getAllEnginesAsync();
  }

  async newPlaylistAsync(obj) {
    return await model.newPlaylistAsync(obj);
  }

  async updatePlaylistAsync(obj) {
    return await model.updatePlaylistAsync(obj);
  }

  async getPlaylistAsync(playlistId) {
    return await model.getPlaylistAsync(playlistId);
  }

  async deletePlaylistAsync(playlistId) {
    return await model.deletePlaylistAsync(playlistId);
  }
}

module.exports = Api;
