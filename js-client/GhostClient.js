let ThinClient = require('thin-client');

let ApiError = require('./ApiError');
let pkg = require('./package');
let Storage = require('./Storage');

let PRODUCTION_API_URL = 'https://ghost-server.app.render.com/api';

class GhostClient extends ThinClient {
  constructor(url, context, opts) {
    url = url || PRODUCTION_API_URL;
    super(url, context, opts);
    this._storage = this.opts.storage || new Storage();
    this._setContextAsync();
  }

  async _setContextAsync() {
    let sessionSecret = await this._storage.getAsync('sessionSecret');
    this.context = this.context || {};
    Object.assign(this.context, {
      sessionSecret,
    });
  }

  clientSimpleMethods() {
    return ['add', 'getViewer'];
  }

  clientDidReceiveCommand(command) {}

  clientDidReceiveData(data) {}

  async loginAsync(username, password) {
    try {
      let result = await this.callAsync('login', username, password);
      if (result && result.sessionSecret) {
        await this._storage.setAsync('sessionSecret', result.sessionSecret);
        await this._setContextAsync();
        return result;
      } else {
        throw ApiError('Problem performing login', 'LOGIN_PROBLEM');
      }
    } catch (e) {
      throw e;
    }
  }

  async signupAsync(userData) {
    // You should give username, email, password

    // let userData = {
    //   connection: 'Username-Password-Authentication',
    //   email: 'ccheever+test3@gmail.com',
    //   username: 'ccheevertest3',
    //   password: 'password',
    //   given_name: '',
    //   family_name: '',
    //   user_metadata: {
    //     onboarded: true,
    //     legacy: false,
    //     bio: 'Building applications with @expo',
    //     username_github: '',
    //     username_twitter: '',
    //     link_personal: '',
    //     industry: '',
    //     location: '',
    //   },
    // };
    let userMetadata = {
      ...userData.user_metadata,
      onboarded: true,
      legacy: false,
      ghostSignup: true,
    };
    let outputUserData = {
      ...userData,
      connection: 'Username-Password-Authentication',
      user_metadata: userMetadata,
    };
    let result = await this.callAsync('signup', outputUserData);
    await this.loginAsync(outputUserData.username, outputUserData.password);
    return result;
  }

  async logoutAsync() {
    // sessionSecret = sessionSecret || (await this._storage.getAsync('sessionSecret'));
    let sessionSecret = await this._storage.getAsync('sessionSecret');

    let result = await this.callAsync('logout', sessionSecret);
    await this._storage.deleteAsync('sessionSecret');
    await this._setContextAsync();
    return result;
  }
}

module.exports = GhostClient;

Object.assign(module.exports, {
  Storage,
  PRODUCTION_API_URL,
  ThinClient,
});
