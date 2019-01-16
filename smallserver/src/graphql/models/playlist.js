let featuredGames = require('~/../featuredGames');

const typeDefs = `
  extend type Query {
    allPlaylists: [Playlist]
    playlist(playlistId: ID!): Playlist
  }

  type Playlist {
    playlistId: ID!
    userId: ID
    user: User
    name: String
    website: String
    description: Json
    coverImage: HostedFile
    coverImageFileId: ID
    mediaItems: [Media]
    metadata: Json
    createdTime: Datetime
    updatedTime: Datetime
  }
`;

const resolvers = {
  Query: {
    allPlaylists: async () => {
      return [featuredGames];
    },

    playlist: async (_, { playlistId }) => {
      if (playlistId == 'playlist:ghost-games') {
        return featuredGames;
      } else {
        return null;
      }
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
