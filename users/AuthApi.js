let fetch = require('node-fetch');

let data = require('../data');
let ExpoApiV2Client = require('./ExpoApiV2Client');

let SignupEndpoint = 'https://exp.host/--/api/v2/auth/createOrUpdateUser';
let LogoutEndpoint = 'https://exp.host/--/api/v2/auth/logoutAsync';

class AuthApi {
  _v2Client() {
    let api = new ExpoApiV2Client();
    Object.assign(api, this.context);
    return api;
  }

  async loginAsync(username, password) {
    let api = this._v2Client();
    return await api.postAsync('auth/loginAsync', {
      username,
      password,
    });
  }

  async logoutAsync(sessionSecret) {
    if (!sessionSecret) {
      this.responseAddWarning('NOT_LOGGED_IN', 'Logging out while not logged in');
      return;
    }
    await fetch(LogoutEndpoint, {
      method: 'POST',
      headers: {
        'Expo-Session': sessionSecret,
      },
    });
  }

  async profileAsync() {
    let api = this._v2Client();
    let user = await api.postAsync('auth/userProfileAsync');
    return user;
  }

  // type SignUpData = {
  //   firstName: string,
  //   lastName: string,
  //   email: string,
  //   username: string,
  //   password: string,
  // };

  async signupAsync(userData) {
    // console.log("userData=", userData);
    let response = await fetch(SignupEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData,
      }),
    });

    let result = await response.json();
    await data.writeGhostSignupAsync(result);
    return result;
  }
}

module.exports = AuthApi;
