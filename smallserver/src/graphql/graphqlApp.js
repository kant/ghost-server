let graphqlYoga = require('graphql-yoga');
let glob = require('glob');
let path = require('path');
let _ = require('lodash');
let User = require('./models/user');

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
  let token = request.get('X-Auth-Token');
  let userId = null;
  if (token) {
    userId = await User.userIdForTokenAsync(token);
  }

  // Testing
  // userId = 1;

  let context = {
    request,
    userId,
    token,
  };

  return context;
}

async function makeGraphqlAppAsync() {
  /*let graphqlMiddleware = async (resolve, parent, args, context, info) => {
    if (!parent) {
      let message =
        info.path.key + ' ' + JSON.stringify(args) + ' ' + JSON.stringify(info.variableValues);
      console.log(message);
    }
  };*/

  let app = new graphqlYoga.GraphQLServer({
    typeDefs: [Query, ...models.map((model) => model.typeDefs)],
    resolvers: _.merge(models.map((model) => model.resolvers)),
    context: makeGraphqlContextAsync,
    // middlewares: [graphqlMiddleware],
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
