let AuthApi = require('./users/AuthApi');

class Api {
  async addAsync(...args) {
    let sum = 0;
    for (let x of args) {
      sum += x;
    }
    return sum;
  }

  async signInAsync(username, password) {
    let result = await AuthApi.signInAsync(username, password);
    this._logArgs = [username, 'XXXXXX'];
    return result;
  }

  async signOutAsync(sessionSecret) {
    return await AuthApi.signOutAsync(sessionSecret);
  }

  async signUpAsync(userInfo) {
    let result = await AuthApi.signUpAsync(userInfo);
    return result;
  }
}

module.exports = Api;
