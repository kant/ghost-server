let featuredGames = require('~/../featuredGames');

const typeDefs = `
  extend type Query {
    allMedia: [Media]
  }

  type Media {
    mediaId: ID!
    mediaUrl: String
    homepageUrl: String
    sourceCodeUrl: String
    slug: String
    name: String
    description: Json
    userId: ID
    coverImageFileId: ID
    coverImage: HostedFile
    instructions: Json
    dimensions: Json
    links: Json
    published: Datetime
    createdTime: Datetime
    updatedTime: Datetime
    tags: Json
    user: User

    # Deprecated
    jamVotingUrl: String
  }
`;

const resolvers = {
  Query: {
    allMedia: async () => {
      return featuredGames.mediaItems;
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
