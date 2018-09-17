let AuthApi = require('./users/AuthApi');
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

  async loginAsync(username, password) {
    // Don't log passwords in cleartext!
    this._logArgs = [username, 'XXXXXX'];

    let result = await this._authApi().loginAsync(username, password);

    return result;
  }

  _authApi() {
    let authApi = new AuthApi();
    authApi.context = { ...this.context };
    return authApi;
  }

  async logoutAsync() {
    let sessionSecret = this.context.sessionSecret;
    let result = {};
    if (!sessionSecret) {
      // console.warn('No current session to logout of; no-oping.');
      this.responseAddWarning('NOT_LOGGED_IN', 'No current session to logout of');
      return;
    }
    return await this._authApi().logoutAsync(sessionSecret);
  }

  async getViewerAsync() {
    return await this._authApi().profileAsync();
  }

  async signupAsync(userInfo) {
    return await this._authApi().signupAsync(userInfo);
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
    return await model.getPlaylistAsync(obj);
  }

  async deletePlaylistAsync(playlistId) {
    return await model.deletePlaylistAsync(playlistId);
  }
}

module.exports = Api;
