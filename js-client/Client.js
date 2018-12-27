let apolloFetch = require('apollo-fetch');
let extractFiles = require('extract-files');

let PRODUCTION_API_URL = 'https://apis.playcastle.io';
let LOCAL_API_URL = 'http://localhost:1380';
let STAGING_API_URL = 'https://apis-staging.playcastle.io';

// This code based on the code here by @jaydenseric
// https://github.com/jaydenseric/apollo-upload-client/blob/master/src/index.js
function constructUploadOptions(requestOrRequests, options) {
  let files = extractFiles.extractFiles(requestOrRequests);

  if (files.length) {
    if (typeof FormData === 'undefined') {
      throw new Error('Environment must support FormData to upload files.');
    }

    options.method = 'POST';

    // Automatically set by fetch when the body is a FormData instance
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
    files.forEach(({ file }, index) => {
      return options.body.append(index, file, file.name);
    });
    return options;
  } else {
    return apolloFetch.constructDefaultOptions(requestOrRequests, options);
  }
}

function makeClient(baseUrl, opts) {
  let _baseUrl = baseUrl || PRODUCTION_API_URL;
  let _opts = Object.assign({}, opts);
  if (!opts.storage) {
    throw new Error('You must specify `storage` in opts to makeClient');
  }
  let _storage = _opts.storage;
  let _apolloFetch = apolloFetch.createApolloFetch({
    uri: _baseUrl + '/graphql',
    constructOptions: constructUploadOptions,
  });

  let _makeClientId = () => {
    let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let t = 'cid:';
    for (let i = 0; i < 16; i++) {
      t += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return t;
  };

  let _getSessionsAsync = async () => {
    let sessions = await _storage.getAsync('sessions');
    if (typeof sessions !== 'object' || Array.isArray(sessions)) {
      sessions = {};
    }
    return sessions;
  };

  let rememberSessionAsync = async (clientId) => {
    let sessions = await _getSessionsAsync();
    sessions[clientId] = true;
    await _storage.setAsync('sessions', sessions);
    return Object.keys(sessions);
  };

  let setSessionAsync = async (clientId) => {
    // Don't try to do this in parallel because there may be race
    // conditions in some of the storage implementations
    // (ex. the FileSystemStorage especially)
    await rememberSessionAsync(clientId);
    await _storage.setAsync('clientId', clientId);
  };

  let newSessionAsync = async () => {
    let clientId = _makeClientId();
    await setSessionAsync(clientId);
    return clientId;
  };

  let getClientIdAsync = async () => {
    let clientId = await _storage.getAsync('clientId');
    if (!clientId) {
      clientId = await newSessionAsync();
    }
    return clientId;
  };

  let forgetSessionAsync = async (clientId) => {
    let sessions = await _getSessionsAsync();
    delete sessions[clientId];
    await _storage.setAsync('sessions', sessions);

    // If this is our current clientId, then stop using it
    // if we are trying to forget it
    if (clientId === (await getClientIdAsync())) {
      await _storage.deleteAsync('clientId');
    }

    return Object.keys(sessions);
  };

  let forgetAllSessionsAsync = async () => {
    await _storage.deleteAsync('sessions');
    await _storage.deleteAsync('clientId');
    return [];
  };

  let getAllSessionsAsync = async () => {
    let sessions = await _getSessionsAsync();
    return Object.keys(sessions);
  };

  let _getRequestHeadersAsync = async () => {
    let headers = {};
    headers['X-ClientId'] = await getClientIdAsync();
    return headers;
  };

  // Add auth header
  _apolloFetch.use(async ({ request, options }, next) => {
    options.headers = options.headers || {};
    Object.assign(options.headers, await _getRequestHeadersAsync());
  });

  let gqAsync = async (query, variables, operationName) => {
    return await _apolloFetch({
      query,
      variables,
      operationName,
    });
  };

  Object.assign(gqAsync, {
    _baseUrl,
    _opts,

    _apolloFetch,
    _makeClientId,
    _getSessionsAsync,
    _getRequestHeadersAsync,

    forgetSessionAsync,
    forgetAllSessionsAsync,
    getClientIdAsync,
    newSessionAsync,
    rememberSessionAsync,
    getAllSessionsAsync,
    setSessionAsync,

    PRODUCTION_API_URL,
    LOCAL_API_URL,
    STAGING_API_URL,
  });

  return gqAsync;
}

module.exports = makeClient;
Object.assign(makeClient, {
  PRODUCTION_API_URL,
  STAGING_API_URL,
  LOCAL_API_URL,
});
