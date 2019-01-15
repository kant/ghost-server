let graphqlYoga = require('graphql-yoga');
let glob = require('glob');
let path = require('path');
let _ = require('lodash');

// https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2
let models = [];
glob.sync('./models/*.js', { cwd: __dirname }).forEach(function(file) {
  models.push(require(path.resolve(__dirname, file)));
});

const Query = `
  scalar Json
  scalar Datetime
  scalar Null
  scalar Upload

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

async function makeGraphqlContextAsync({ request }) {
  /*clientId = request.get('X-ClientId');
  let userId = null;
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
  return context;*/

  return {
    request,
  };
}

async function makeGraphqlAppAsync() {
  let graphqlMiddleware = async (resolve, parent, args, context, info) => {
    if (!parent) {
      let message =
        info.path.key + ' ' + JSON.stringify(args) + ' ' + JSON.stringify(info.variableValues);
      console.log(message);
    }
  };

  let app = new graphqlYoga.GraphQLServer({
    typeDefs: [Query, ...models.map((model) => model.typeDefs)],
    resolvers: _.merge(models.map((model) => model.resolvers)),
    context: makeGraphqlContextAsync,
    middlewares: [graphqlMiddleware],
  });
  //app.use(requestTimingMiddleware);
  //app.use(serverInfoMiddleware);

  return app;
}

let _app = null;
async function graphqlAppAsync() {
  if (_app === null) {
    _app = await makeGraphqlAppAsync();
  }
  return _app;
}

module.exports = {
  graphqlAppAsync,
};
