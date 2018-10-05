let apolloFetch = require('apollo-fetch');
let extractFiles = require('extract-files');

let Storage = require('./Storage');

let PRODUCTION_API_URL = 'https://ghost-server.app.render.com';

// This code based on the code here by @jaydenseric
// https://github.com/jaydenseric/apollo-upload-client/blob/master/src/index.js
function constructUploadOptions(requestOrRequests, options) {
  let files = extractFiles.extractFiles(requestOrRequests);

  if (files.length) {
    if (typeof FormData === 'undefined') {
      throw new Error('Environment must support FormData to upload files.');
    }

    options.method = 'POST';

    // Automatically set by fetch when the body is a FormData instance.
    delete options.headers['content-type'];

    // GraphQL multipart request spec:
    // https://github.com/jaydenseric/graphql-multipart-request-spec
    options.body = new FormData();
    options.body.append('operations', JSON.stringify(requestOrRequests));
    options.body.append(
      'map',
      JSON.stringify(
        files.reduce((map, { path }, index) => {
          map[`${index}`] = [path];
          return map;
        }, {})
      )
    );
    files.forEach(({ file }, index) => options.body.append(index, file, file.name));
    return options;
  } else {
    return apolloFetch.constructDefaultOptions(requestOrRequests, options);
  }

  // if (files.length) {
  //   if (typeof FormData === 'undefined') {
  //     throw new Error('Environment must support FormData to upload files.');
  //   }

  //   options.method = 'POST';
  //   options.body = new FormData();
  //   options.body.append('operations', JSON.stringify(requestOrRequests));
  //   options.body.append('map', JSON.stringify({}));
  //   files.forEach(({ path, file }) => options.body.append(path, file));

  //   return options;
  // } else {
  //   return apolloFetch.constructDefaultOptions(requestOrRequests, options);
  // }
}

class GhostClient {
  constructor(baseUrl, opts) {
    this.url = baseUrl || PRODUCTION_API_URL;
    this.opts = Object.assign({}, opts);
    this._storage = this.opts.storage || new Storage();
    this._apolloFetch = apolloFetch.createApolloFetch({
      uri: this.url + '/graphql',
      constructOptions: constructUploadOptions,
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
