let graphql = require('graphql');

let auth = require('./auth');

class Api {

  async __graphqlQueryAsync(query, variableValues, operationName, fieldResolver) {
    // argsOrSchema,
    // source,
    // rootValue,
    // contextValue,
    // variableValues,
    // operationName,
    // fieldResolver,
    let graphqlContext = this.serverContext.graphqlContext;

    return await graphql.graphql(
      this.serverContext.executableSchema,
      query,
      null,
      graphqlContext,
      variableValues,
      operationName,
      fieldResolver
    );
  }

  async getCurrentJamPlaylistAsync() {
    let result = await this.__graphqlQueryAsync(/* GraphQL */ `
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
    `);
    return result.data.currentPlaylist;
  }

  async loginAsync(usernameOrSimilar, password) {
    this._logArgs = [usernameOrSimilar, 'XXXXXX'];
    let result = await this.__graphqlQueryAsync({
      query: /* GraphQL */ `
        mutation($usernameOrSimilar: String!, $password: String!) {
          login(usernameOrSimilar: $usernameOrSimilar, password: $password) {
            userId
            name
            username
            photo {
              url
              width
              height
            }
          }
        }
      `,
      variableValues: {
        usernameOrSimilar,
        password,
      },
    });
    return result;
  }

  async logoutAsync() {
    return await auth.logoutAsync(this.clientId);
  }
}

module.exports = Api;
