let assert = require('assert');

let graphql = require('graphql'); // Not in package.json dependencies but will be installed by graphql-yoga
let graphqlYoga = require('graphql-yoga');
let time = require('@expo/time');

let loaders = require('./loaders');
let model = require('./model');
let resolvers = require('./resolvers');
let typeDefs = require('./typeDefs');

async function makeGraphqlContextAsync({ request, userId }) {
  let clientId = null;
  if (request) {
    if (userId) {
      throw Error('Provide only one of `userId` and `request` to `makeGraphqlContextAsync`');
    }
    clientId = request.get('X-ClientId');
    if (clientId) {
      userId = await model.getUserIdForSessionAsync(clientId);
    }
  }
  request = request || {};
  return {
    request,
    loaders: loaders.createLoaders(),
    clientId,
    userId,
  };
}

async function makeGraphqlAppAsync() {
  let graphqlMiddleware = async (resolve, parent, args, context, info) => {
    if (!parent) {
      let message =
        info.path.key + ' ' + JSON.stringify(args) + ' ' + JSON.stringify(info.variableValues);
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

  return app;
}

let _app = null;
async function graphqlAppAsync() {
  if (_app === null) {
    _app = await makeGraphqlAppAsync();
  }
  return _app;
}

async function graphqlQueryAsync({
  query,
  variableValues,
  operationName,
  fieldResolver,
  userId,
  opts,
}) {
  opts = opts || {};

  let app = await graphqlAppAsync();
  let graphqlContext = await makeGraphqlContextAsync({
    userId,
  });

  return await graphql.graphql(
    app.executableSchema,
    query,
    null,
    graphqlContext,
    variableValues,
    operationName,
    fieldResolver
  );
}

module.exports = {
  makeGraphqlContextAsync,
  makeGraphqlAppAsync,
  graphqlAppAsync,
  graphqlQueryAsync,
};
