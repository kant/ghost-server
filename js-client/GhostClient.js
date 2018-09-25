let apolloFetch = require('apollo-fetch');

let Storage = require('./Storage');

let PRODUCTION_API_URL = 'https://ghost-server.app.render.com';

class GhostClient {
  constructor(baseUrl, opts) {
    this.url = baseUrl || PRODUCTION_API_URL;
    this.opts = Object.assign({}, opts);
    this._storage = this.opts.storage || new Storage();
    this._apolloFetch = apolloFetch.createApolloFetch({
      uri: this.url + '/graphql',
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

  async callAsync(method, ...args) {
    if (method === 'getCurrentJamPlaylist') {
      let response = await this.graphqlAsync({
        query: /* GraphQL */ `
          query {
            currentPlaylist {
              playlistId
              name
              mediaItems {
                mediaId
                name
                published
                instructions
                description
                mediaUrl
                coverImage {
                  url
                  height
                  width
                }
                user {
                  userId
                  name
                  username
                  photo {
                    url
                    height
                    width
                  }
                }
              }
            }
          }
        `,
      });
      return response.data.currentPlaylist;
    }
  }

  async graphqlAsync(...args) {
    return await this._apolloFetch(...args);
  }
}

module.exports = (...args) => {
  let client = new GhostClient(...args);
  let f = async (...graphqlArgs) => {
    // Let the caller use positional arguments
    if (typeof graphqlArgs[0] === 'string') {
      let [query, variables, operationName] = graphqlArgs;
      graphqlArgs = [
        {
          query,
          variables,
          operationName,
        },
      ];
    }

    return await client.graphqlAsync(...graphqlArgs);
  };
  f.graphqlAsync = f;
  f._client = client;
  return f;
};

Object.assign(module.exports, {
  GhostClient,
  Storage,
  PRODUCTION_API_URL,
});
