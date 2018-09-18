module.exports = `
scalar Json
scalar Datetime

type Media {
  mediaId: ID! @unique
  name: String
  description: Json
  userId: ID
  instructions: Json
  dimensions: Json
  engineId: ID
  createdTime: Datetime
  updatedTime: Datetime
  user: User
  engine: Engine
}

type User {
  userId: ID! @unique
  name: String
  location: String
  username: String
  about: Json
  photoUrl: String
  createdTime: Datetime
  updatedTime: Datetime
}

type Engine {
  engineId: ID! @unique
  name: String
  url: String
  createdTime: Datetime
  updatedTime: Datetime
}

type Playlist {
  playlistId: ID! @unique
  userId: ID
  user: User
  name: String
  description: Json
  mediaItems: [Media]
  createdTime: Datetime
  updatedTime: Datetime
}

type Query {
    hello(name: String): String!
    media(mediaId: ID!): Media
    user(userId: ID!): User
    userByUsername(username: String!): User
    engine(engineId: ID!): Engine
    playlist(playlistId: ID!): Playlist
  }

type Mutation {
  updateUser(userId: ID!, update: Json): User
}
`;
