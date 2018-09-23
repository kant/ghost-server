module.exports = /* GraphQL */ `
  scalar Json
  scalar Datetime
  scalar Null

  type Image {
    url: String
    height: Float
    width: Float
    donwloaded: Int
  }

  type Media {
    mediaId: ID! @unique
    mediaUrl: String
    name: String
    description: Json
    userId: ID
    coverImage: Image
    instructions: Json
    dimensions: Json
    engineId: ID
    published: Datetime
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
    photo: Image
    isTeam: Boolean
    members: [User]
    admins: [User]
    createdTime: Datetime
    updatedTime: Datetime
  }

  type Engine {
    engineId: ID! @unique
    name: String
    url: String
    about: Json
    image: Image
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
    inspect: String
    hello(name: String): String!
    media(mediaId: ID!): Media
    user(userId: ID!): User
    userByUsername(username: String!): User
    engine(engineId: ID!): Engine
    playlist(playlistId: ID!): Playlist
    playlistsForUser(userId: ID!): [Playlist]
    currentPlaylist: Playlist
  }

  input UserInput {
    name: String
    location: String
    username: String
    about: Json
    photo: ImageInput
    isTeam: Boolean
  }

  input ImageInput {
    url: String
    height: Float
    width: Float
  }

  input EngineInput {
    engineId: ID
    name: String
    url: String
    about: Json
    image: ImageInput
  }

  input MediaInput {
    mediaId: ID
    mediaUrl: String
    name: String
    description: Json
    userId: ID
    coverImage: ImageInput
    instructions: Json
    dimensions: Json
    engineId: ID
    published: Datetime
  }


  type Mutation {
    login(usernameOrSimilar: String!, password: String!): User
    logout: Null
    signup(user: UserInput): User
    updateUser(userId: ID!, user: UserInput): User
    addEngine(engine: EngineInput): Engine
    updateEngine(engineId: ID!, engine: EngineInput): Engine
    addMedia(media: MediaInput): Media
    updateMedia(mediaId: ID!, media: MediaInput): Media
  }
`;
