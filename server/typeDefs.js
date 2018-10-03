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
    links: Json
    photo: Image
    isTeam: Boolean
    members: [User]
    admins: [User]
    createdTime: Datetime
    updatedTime: Datetime
    subscribers: [User]
    subscriberCount: Int
    subscriptions: [User]
    subscriptionCount: Int
    mediaItems: [Media]
    playlists: [Playlist]
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
    website: String
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
    object: SearchResultObject
  }

  type Tag {
    tag: String
  }

  union SearchResultObject = User | Media | Playlist | Tool | Tag

  type MediaAndPlaylistSearchResults {
    mediaItems: [Media]
    playlistItems: [Playlist]
    recommendedItems: [Media]
  }

  type Query {
    env: String
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
    searchMediaAndPlaylists(
      query: String
      cursorPosition: Int
      limit: Int
    ): MediaAndPlaylistSearchResults
    me: User

    allMedia: [Media]
    allUsers: [User]
    allTools: [Tool]
    allTags: [String]
    allTeams: [User]
    allPlaylists: [Playlist]

    subscribers(toId: ID): [User]
    subscriptions(fromId: ID): [User]
    subscriberCount(toId: ID): Int
    subscriptionCount(fromId: ID): Int
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
    otherUsernames: Json
    links: Json
    about: Json
    info: Json
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
    name: String
    mediaUrl: String
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

  input PlaylistInput {
    name: String
    userId: ID
    website: String
    description: Json
    image: ImageInput
    mediaItems: [ID]
  }

  type UserMutation {
    convertToTeam: User
    convertToUser: User
    update(update: UserInput): User
    delete: Null
    addTeamMembers(userIdList: [ID]): User
    removeTeamMembers(userIdList: [ID]): User
    addTeamAdmins(userIdList: [ID]): User
    removeTeamAdmins(userIdList: [ID]): User
  }

  type MediaMutation {
    update(update: MediaInput): Media
    delete: Null
    addTags(tagList: [String]!): Media
    removeTags(tagList: [String]!): Media
    addTools(tagList: [ID]!): Media
    removeTools(tagLIst: [ID]!): Media
  }

  type ToolMutation {
    update(update: ToolInput): Tool
    delete: Null
  }

  type PlaylistMutation {
    update(update: PlaylistInput): Playlist
    delete: Null
  }

  type Mutation {
    User(userId: ID, username: String): UserMutation
    me: UserMutation

    Tool(toolId: ID): ToolMutation
    Media(mediaId: ID): MediaMutation
    Playlist(playlistId: ID): PlaylistMutation

    login(who: String, username: String, userId: ID, password: String!): User
    logout: Null
    signup(user: UserInput!, password: String!): User

    addTool(tool: ToolInput): Tool
    updateTool(toolId: ID!, tool: ToolInput): Tool
    deleteTool(toolId: ID!): Boolean
    addMedia(media: MediaInput): Media
    updateMedia(mediaId: ID!, media: MediaInput): Media
    deleteMedia(mediaId: ID!): Boolean
    addMediaTags(mediaId: ID!, tags: [String!], tag: String): Media
    removeMediaTags(mediaId: ID!, tags: [String!], tag: String): Media
    addMediaTools(mediaId: ID!, toolId: ID, toolIds: [ID!]): Media
    removeMediaTools(mediaId: ID!, toolId: ID, toolIds: [ID!]): Media
    addPlaylist(playlist: PlaylistInput): Playlist
    updatePlaylist(playlistId: ID!, playlist: PlaylistInput): Playlist
    deletePlaylist(playlistId: ID!): Boolean
    changePassword(oldPassword: String!, newPassword: String!): Boolean
    subscribe(fromId: ID, toId: ID!): Boolean
    unsubscribe(fromId: ID, toId: ID!): Boolean
  }
`;
