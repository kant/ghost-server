let assert = require('assert');

let model = require('./model');

module.exports = {
  Query: {
    hello: (_, { name }, context) =>
      `Hello ${name || 'World'}` + JSON.stringify(Object.keys(context.request)) + JSON.stringify(Object.keys(context.request.headers)) + JSON.stringify(context.request.connection.remoteAddress),
    media: async (_, { mediaId }) => {
      return await model.getMediaAsync(mediaId);
    },
    user: async (_, { userId }) => {
      return await model.getUserAsync(userId);
    },
    userByUsername: async (_, { username }) => {
      return await model.getUserByUsernameAsync(username);
    },
    engine: async (_, { engineId }) => {
      return await model.getEngineAsync(engineId);
    },
  },
  Mutation: {
    updateUser: async (_, { userId, update }) => {
      console.log('updateUser', { userId, update });
      if (update.userId) {
        assert.equal(update.userId, userId);
      }
      update.userId = userId;
      await model.updateUserAsync(update);
      return await model.getUserAsync(userId);
    },
  },
};
