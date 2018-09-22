let apolloFetch = require('apollo-fetch');

let ApiError = require('./ApiError');
let Storage = require('./Storage');

let PRODUCTION_API_URL = 'https://ghost-server.app.render.com/api';

let fetch = require('cross-fetch');


class GhostClient {
  constructor(url, context, opts) {
    this.url = url || PRODUCTION_API_URL;
    this.opts = Object.assign({}, opts);
    this._storage = this.opts.storage || new Storage();
    this._apolloFetch = apolloFetch.createApolloFetch({
      uri: url + '/graphql',
    });

    // Add auth header
    this._apolloFetch.use(async ({ request, options }, next) => {
      options.headers = options.headers || {};
      Object.assign(options.headers, await this._getRequestHeadersAsync());
      next();
    });
  }

  _makeClientIdentifier() {
    let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let t = 'xci:';
    for (let i = 0; i < 16; i++) {
      t += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return t;
  }

  async _getClientIdentifierAsync() {
    let token = await this._storage.getAsync('client-identifier');
    if (!token) {
      token = this._makeClientIdentifier();
      await this._storage.setAsync('client-identifier', token);
    }
    return token;
  }

  async _getRequestHeadersAsync() {
    let headers = {};
    headers['X-ClientId'] = await this._getClientIdentifierAsync();
    return headers;
  }

  async clientDidReceiveDataAsync(data) {}

  async clientDidReceiveCommandAsync(command) {
  }

  async clientDidReceiveWarningAsync(code, message) {
    console.warn('API Response Warning: ' + code + ': ' + message);
  }

  async callAsync(method, ...args) {
    if (method.startsWith('client') || method.startsWith('_')) {
      throw new Error('Method name not allowed: ' + method);
    }

    let headers = {
      'Content-Type': 'application/json',
    };
    Object.assign(headers, await this._getRequestHeadersAsync());

    let response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        context: this.context,
        method,
        args,
      }),
      headers,
    });

    let r;
    let responseText;
    try {
      responseText = await response.text();
      r = JSON.parse(responseText);
    } catch (e) {
      console.error(responseText);
      let err = new Error("Didn't understand response from server");
      err.ServerError = true;
      err.responseText = responseText;
      throw err;
    }

    if (r.error) {
      let err = new Error(r.error.message);
      Object.assign(err, r.error);
      err.ApiError = true;
      throw err;
    }

    if (r.clientError) {
      let err = new Error(r.clientError.message);
      Object.assign(err, r.clientError);
      err.ClientError = true;
      throw err;
    }

    if (r.data) {
      await this.clientDidReceiveDataAsync(r.data);
    }

    // Handle commands
    if (r.commands) {
      for (let command of r.commands) {
        await this.clientDidReceiveCommandAsync(command);
      }
    }

    if (r.warnings) {
      for (let [code, message] of r.warnings) {
        await this.clientDidReceiveWarningAsync(code, message);
      }
    }

    return r.result;
  }

  async graphqlAsync(...args) {
    return await this._apolloFetch(...args);
  }
}

module.exports = GhostClient;

Object.assign(module.exports, {
  Storage,
  PRODUCTION_API_URL,
});
