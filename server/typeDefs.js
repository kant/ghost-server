module.exports = /* GraphQL */ `
  scalar Json
  scalar Datetime
  scalar Null

  type Image {
    url: String
    height: Float
    width: Float
    donwloaded: Int
    type: String
  }

  type Media {
    mediaId: ID! @unique
    mediaUrl: String
    slug: String
    name: String
    description: Json
    userId: ID
    coverImage: Image
    instructions: Json
    dimensions: Json
    links: Json
    published: Datetime
    createdTime: Datetime
    updatedTime: Datetime
    tags: Json
    user: User
    tools: [Tool]
    toolIds: [ID]
  }

  type User {
    userId: ID! @unique
    name: String
    location: String
    username: String
    about: Json
    otherUsernames: Json
    Links: Json
    photo: Image
    isTeam: Boolean
    members: [User]
    admins: [User]
    createdTime: Datetime
    updatedTime: Datetime
  }

  type Tool {
    toolId: ID! @unique
    name: String
    url: String
    about: Json
    image: Image
    tags: Json
    creatorId: ID
    creator: User
    createdTime: Datetime
    updatedTime: Datetime
  }

  type Playlist {
    playlistId: ID! @unique
    userId: ID
    user: User
    name: String
    description: Json
    image: Image
    mediaItems: [Media]
    createdTime: Datetime
    updatedTime: Datetime
  }

  type SearchResult {
    type: String
    title: String
    url: String
    slug: String
    id: String
    snippet: String
    metadata: Json
    image: Image
    score: Float
  }

  type Query {
    inspect: String
    hello(name: String): String!
    media(mediaId: ID!): Media
    user(userId: ID!): User
    userByUsername(username: String!): User
    tool(toolId: ID!): Tool
    playlist(playlistId: ID!): Playlist
    playlistsForUser(userId: ID!): [Playlist]
    currentPlaylist: Playlist
    search(query: String, cursorPosition: Int, limit: Int): [SearchResult]
    whoAmI: User
  }

  input ImageInput {
    url: String
    height: Float
    width: Float
    type: String
    downloaded: Int
  }

  input UserInput {
    name: String
    location: String
    username: String
    about: Json
    photo: ImageInput
    isTeam: Boolean
  }

  input ToolInput {
    toolId: ID
    name: String
    url: String
    about: Json
    creatorId: ID
    tags: [String]
    image: ImageInput
  }

  input MediaInput {
    mediaId: ID
    mediaUrl: String
    name: String
    slug: String
    description: Json
    links: Json
    userId: ID
    coverImage: ImageInput
    instructions: Json
    dimensions: Json
    toolIds: [ID]
    tags: [String]
    published: Datetime
  }

  type Mutation {
    login(usernameOrSimilar: String!, password: String!): User
    logout: Null
    signup(user: UserInput): User
    updateUser(userId: ID!, user: UserInput): User

    addTool(tool: ToolInput): Tool
    updateTool(toolId: ID!, tool: ToolInput): Tool
    deleteTool(toolId: ID!): Boolean
    addMedia(media: MediaInput): Media
    updateMedia(mediaId: ID!, media: MediaInput): Media
    deleteMedia(mediaId: ID!): Boolean
    addTeamMember(teamId: ID!, userId: ID!): User
    addTeamMembers(teamId: ID!, userIdList: [ID]): User
    removeTeamMember(teamId: ID!, userId: ID!): User
    removeTeamMembers(teamId: ID!, userIdList: [ID]): User
    addTeamAdmin(teamId: ID!, userId: ID!): User
    addTeamAdmins(teamId: ID!, userIdList: [ID]): User
    removeTeamAdmin(teamId: ID!, userId: ID!): User
    removeTeamAdmins(teamId: ID!, userIdList: [ID]): User
    convertUserToTeam(userId: ID!, adminUserIdList: [ID]!): User
    convertTeamToUser(teamId: ID!): User
    addMediaTags(mediaId: ID!, tags: [String], tag: String): Media
    removeMediaTags(mediaId: ID!, tags: [String], tag: String): Media
  }
`;
