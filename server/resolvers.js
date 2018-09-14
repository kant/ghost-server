let model = require('./model');

module.exports = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
    media: async (_, { mediaId }) => {
      return await model.getMediaAsync(mediaId);
    },
    user: async (_, { userId }) => {
      return await model.getUserAsync(userId);
    },
    engine: async (_, { engineId }) => {
      return await model.getEngineAsync(engineId);
    },
  },
};
