let graphqlApp = require('./graphqlApp');

function withClientId(clientId) {
  return async (query, variableValues, opts) => {
    let opts_ = {
      ...opts,
      clientId,
    };
    let result = await graphqlApp.graphqlQueryAsync({
      query,
      variableValues,
      opts: opts_,
    });
    if (result.errors && !opts.allowErrors) {
      throw new Error('GraphQL Error: ' + JSON.stringify(result.errors));
    }
    return result;
  };
}

module.exports = {
  withClientId,
};
