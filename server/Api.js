let graphql = require('graphql');

let auth = require('./auth');
let ClientError = require('./ClientError');
let model = require('./model');
let passwordlib = require('./passwordlib');

class Api {
  async addAsync(...args) {
    let sum = 0;
    for (let x of args) {
      sum += x;
    }
    return sum;
  }

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

  async newPlayRecordAsync(obj) {
    return await model.newPlayRecordAsync(obj);
  }

  async getPlayRecordsAsync(mediaId, opts) {
    return await model.getPlayRecordsAsync(mediaId, opts);
  }

  async getMediaAsync(mediaId) {
    return await model.getMediaAsync(mediaId);
  }

  async getAllMediaAsync() {
    return await model.getAllMediaAsync();
  }

  async updateMediaAsync(obj) {
    return await model.updateMediaAsync(obj);
  }

  async newMediaAsync(obj) {
    return await model.newMediaAsync(obj);
  }

  async newEngineAsync(obj) {
    return await model.newEngineAsync(obj);
  }

  async updateEngineAsync(obj) {
    return await model.updateEngineAsync(obj);
  }

  async getAllEnginesAsync() {
    return await model.getAllEnginesAsync();
  }

  async newPlaylistAsync(obj) {
    return await model.newPlaylistAsync(obj);
  }

  async updatePlaylistAsync(obj) {
    return await model.updatePlaylistAsync(obj);
  }

  async getPlaylistAsync(playlistId) {
    return await model.getPlaylistAsync(playlistId);
  }

  async deletePlaylistAsync(playlistId) {
    return await model.deletePlaylistAsync(playlistId);
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
    // let createdIp = this.serverContext.req.ip;
    // return await auth.loginAsync(this.clientId, usernameOrSimilar, password, { createdIp });
  }

  async logoutAsync() {
    return await auth.logoutAsync(this.clientId);
  }
}

module.exports = Api;
