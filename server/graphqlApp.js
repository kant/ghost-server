let graphqlYoga = require('graphql-yoga');
let time = require('@expo/time');

let loaders = require('./loaders');
let model = require('./model');
let resolvers = require('./resolvers');
let typeDefs = require('./typeDefs');

async function makeGraphqlContextAsync({ request }) {
  let clientId = request.get('X-ClientId');
  let userId = null;
  if (clientId) {
    userId = await model.getUserIdForSessionAsync(clientId);
  }
  return {
    request,
    loaders: loaders.createLoaders(),
    clientId,
    userId,
  };
}

async function graphqlAppAsync() {
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

module.exports = {
  makeGraphqlContextAsync,
  graphqlAppAsync,
};
