let assert = require('assert');

let model = require('./model');

module.exports = {
  Query: {
    hello: (_, { name }, context) =>
      `Hello ${name || 'World'}` +
      JSON.stringify(Object.keys(context.request)) +
      JSON.stringify(Object.keys(context.request.headers)) +
      JSON.stringify(context.request.connection.remoteAddress),
    media: async (_, { mediaId }, context) => {
      return await context.loaders.media.load(mediaId);
    },
    user: async (_, { userId }) => {
      return await context.loaders.user.load(userId);
    },
    userByUsername: async (_, { username }) => {
      return await model.getUserByUsernameAsync(username);
    },
    engine: async (_, { engineId }) => {
      return await context.loaders.engine.load(engineId);
    },
    playlist: async (_, { playlistId }, context) => {
      return await context.loaders.playlist.load(playlistId);
    },
    playlistsForUser: async (_, { userId }) => {
      return await model.getPlaylistsForUser(userId);
    },
  },
  Media: {
    user: async (media, {}, context, info) => {
      return await context.loaders.user.load(media.userId);
      // return await model.getUserAsync(media.userId);
    },
    engine: async (media, {}, context, info) => {
      return await context.loaders.engine.load(media.engineId);
      // return await model.getEngineAsync(media.engineId);
    },
  },
  Playlist: {
    mediaItems: async (playlist, {}, context, info) => {
      return await context.loaders.media.loadMany(playlist.mediaItems);
      // return await model.multigetMediaAsync(playlist.mediaItems, { asList: true });
    },
  },
  Mutation: {
    updateUser: async (_, { userId, update }) => {
      if (update.userId) {
        assert.equal(update.userId, userId);
      }
      update.userId = userId;
      await model.updateUserAsync(update);
      return await model.getUserAsync(userId);
    },
  },
};
