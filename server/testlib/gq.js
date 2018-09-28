let graphqlApp = require('../graphqlApp');

function withClientId(clientId, opts) {
  let opts_1 = opts;
  return async (query, variableValues, opts) => {
    let opts_2 = opts;
    let opts_ = {
      ...opts_1,
      ...opts_2,
      clientId,
    };
    let result = await graphqlApp.graphqlQueryAsync({
      query,
      variableValues,
      opts: opts_,
    });
    if (result.errors && !opts_.allowErrors) {
      throw new Error(
        'GraphQL Error: ' + JSON.stringify({ errors: result.errors, query, variableValues })
      );
    }
    return result;
  };
}

module.exports = {
  withClientId,
};
