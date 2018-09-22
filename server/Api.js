let graphql = require('graphql');

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
    console.log(graphqlContext.loaders);

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

  async loginAsync(usernameOrSimilar, password) {
    let user = await model.getUserForLoginAsync(usernameOrSimilar);
    if (!user) {
      throw ClientError(
        "There doesn't seem to be a user with that username or similar",
        'USER_NOT_FOUND'
      );
    }
    let ok = await passwordlib.checkUserPasswordAsync(user.userId, password);
    if (!ok) {
      throw ClientError(
        "Incorrect password", 'INCORRECT_PASSWORD'
      );
    }

    let session = await model.newSessionAsync(user.userId);

    this.responseAddCommand({
      command: 'setSession',
      sessionS
    })
    return user;
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
}

module.exports = Api;
