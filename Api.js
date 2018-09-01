let AuthApi = require('./users/AuthApi');
let ClientError = require('./ClientError');

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
    authApi._context = {...this._context};
    return authApi;
  }

  async logoutAsync(sessionSecret) {
    let _sessionSecret = sessionSecret || this.context.sessionSecret;
    if (!_sessionSecret) {
      console.warn("No current session to logout of; no-oping.");
      // throw ClientError('No current session to log out of', 'NO_CURRENT_SESSION');
    }
    return await this._authApi().logoutAsync(_sessionSecret);
  }

  async profileAsync() {
    return await this._authApi().profileAsync(this._context);
  }

  async signUpAsync(userInfo) {
    let result = await this._authApi().signupAsync(userInfo);
    return result;
  }
}

module.exports = Api;
