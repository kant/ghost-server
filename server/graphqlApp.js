let graphql = require('graphql'); // Not in package.json dependencies but will be installed by graphql-yoga
let graphqlYoga = require('graphql-yoga');
let time = require('@expo/time');

let db = require('./db');
let loaders = require('./loaders');
let model = require('./model');
let resolvers = require('./resolvers');
let typeDefs = require('./typeDefs');

async function makeGraphqlContextAsync({ request, clientId }) {
  if (request) {
    clientId = request.get('X-ClientId');
  } else {
    clientId = clientId || '__shell__' + db.getTestId();
  }
  let userId = null;
  let publicId = null;
  if (clientId) {
    [userId, publicId] = await Promise.all([
      model.getUserIdForSessionAsync(clientId),
      model.getPublicIdForClientIdAsync(clientId),
    ]);
  }
  request = request || {};

  let context = {
    request,
    clientId,
    userId,
    publicId,
  };
  // The loaders need access to the context in case any of them
  // need to call into other loaders
  context.loaders = loaders.createLoaders(context);
  return context;
}

async function makeGraphqlAppAsync() {
  let graphqlMiddleware = async (resolve, parent, args, context, info) => {
    if (!parent) {
      // Hide anything that looks like a password from logs
      let variableValues = { ...info.variableValues };
      let queryArgs = { ...args };
      for (let k in variableValues) {
        if (k.toLowerCase().search('password') !== -1) {
          variableValues[k] = 'XXXXXX';
        }
      }
      for (let k in queryArgs) {
        if (k.toLowerCase().search('password') !== -1) {
          queryArgs[k] = 'XXXXXX';
        }
      }

      let message =
        info.path.key + ' ' + JSON.stringify(queryArgs) + ' ' + JSON.stringify(variableValues);
      context.request.__logMessage = message;
      let result;
      try {
        result = await Promise.resolve(resolve());
      } catch (e) {
        // A dev/prod difference. In general, I think these are very bad
        // but here, the risk/reward tradeoff is probably worth it since we
        // don't want to expose stack traces, etc. to end users, but we do
        // want to see errors if they happen while we're developing stuff
        if (process.env.NODE_ENV === 'production') {
          if (e.type === 'CLIENT_ERROR') {
            throw e;
          } else {
            throw new Error('Internal Server Error');
          }
        } else {
          throw e;
        }
      } finally {
      }
      return result;
    } else {
      return resolve();
    }
  };

  let serverInfoMiddleware = (req, res, next) => {
    req.baseUrl = req.protocol + '://' + req.get('Host');
    next();
  };

  let requestTimingMiddleware = (req, res, next) => {
    let tk = time.start();
    res.once('finish', () => {
      time.end(tk, 'request', {
        threshold: req.__timingThreshold || -1,
        message: req.url + ' ' + (req.__logMessage || ''),
      });
    });
    next();
  };

  let app = new graphqlYoga.GraphQLServer({
    typeDefs,
    resolvers,
    context: makeGraphqlContextAsync,
    middlewares: [graphqlMiddleware],
  });
  app.use(requestTimingMiddleware);
  app.use(serverInfoMiddleware);

  return app;
}

let _app = null;
async function graphqlAppAsync() {
  if (_app === null) {
    _app = await makeGraphqlAppAsync();
  }
  return _app;
}

/**
 * Runs a GraphQL query and returns the results
 */
async function graphqlQueryAsync({
  query,
  variableValues,
  operationName,
  fieldResolver,
  clientId,
  opts,
}) {
  let tk = time.start();

  opts = opts || {};
  clientId = clientId || opts.clientId;

  let app = await graphqlAppAsync();
  let graphqlContext = await makeGraphqlContextAsync({
    clientId,
  });

  try {
    return await graphql.graphql(
      app.executableSchema,
      query,
      null,
      graphqlContext,
      variableValues,
      operationName,
      fieldResolver
    );
  } finally {
    let logLimit = 256;
    query = query || '<No Query (?!)>';
    let message = query
      .substr(0, logLimit)
      .replace(/\s+/g, ' ')
      .trim();
    if (query.length > logLimit) {
      message += '...';
    }
    time.end(tk, 'graphql', { message });
  }
}

module.exports = {
  makeGraphqlContextAsync,
  makeGraphqlAppAsync,
  graphqlAppAsync,
  graphqlQueryAsync,
};
