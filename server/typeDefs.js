module.exports = /* GraphQL */ `
  scalar Json
  scalar Datetime
  scalar Null
  scalar Upload

  type Image {
    url: String
    height: Float
    width: Float
    downloaded: Int
    type: String
  }

  type Media {
    mediaId: ID! @unique
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
    tools: [Tool]
    toolIds: [ID]
    jamPlaylist: Playlist
    jamPlaylistId: ID
    jamVotingUrl: String
  }

  type User {
    userId: ID! @unique
    name: String
    location: String
    username: String
    about: Json
    otherUsernames: Json
    links: Json
    photo: HostedFile
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
    importedFromAnotherSite: Boolean
    claimedByUser: Boolean
    isReal: Boolean
    emailAddresses: [Email]
    email: String # Primary email
    phoneNumbers: [Phone]
    phone: String # Primary phone number
  }

  type Email {
    email: String
    isPrimary: Boolean
    confirmed: Boolean
    bouncing: Boolean
    commandeered: Boolean
    rawEmail: String
  }

  type Phone {
    number: String
    country: String
    isPrimary: Boolean
    confirmed: Boolean
    bouncing: Boolean
    commandeered: Boolean
    rawNumber: String
  }

  type Tool {
    toolId: ID! @unique
    name: String
    url: String
    about: Json
    image: HostedFile
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
    coverImage: HostedFile
    coverImageFileId: ID
    mediaItems: [Media]
    metadata: Json
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
    image: HostedFile
    score: Float
    object: SearchResultObject
  }

  type Tag {
    tag: String
  }

  type SessionInfo {
    clientId: ID
    userId: ID
    user: User
    fromIp: String
    createdTime: Datetime
  }

  union SearchResultObject = User | Media | Playlist | Tool | Tag

  type MediaAndPlaylistSearchResults {
    mediaItems: [Media]
    playlists: [Playlist]
    playlistItems: [Playlist]
    recommendedItems: [Media]
  }

  type HostedFile {
    fileId: ID
    hash: String
    name: String
    encoding: String
    mimeType: String
    userId: ID
    user: User
    uploadedTime: Datetime
    width: Int
    height: Int
    originUrl: String
    imgixUrl: String
    url: Null
  }

  type Query {
    env: String
    _debugInfo: Json
    hello(name: String): String!
    media(mediaId: ID!): Media
    mediaByMediaUrl(mediaUrl: String!): Media
    user(userId: ID!): User
    userByUsername(username: String!): User
    tool(toolId: ID!): Tool
    playlist(playlistId: ID!): Playlist
    playlistsForUser(userId: ID!): [Playlist]
    currentPlaylist: Playlist
    search(query: String, cursorPosition: Int, types: Json, limit: Int): [SearchResult]
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

    subscribers(toId: ID!): [User]
    subscriptions(fromId: ID!): [User]
    subscriberCount(toId: ID!): Int
    subscriptionCount(fromId: ID!): Int

    fileInfo(fileId: ID!): HostedFile

    sessionInfoForClientIds(clientIdList: [ID!]!): [SessionInfo]
    userForLoginInput(who: String!): User

    validateSignup(inputs: Json!): Json
  }

  input UserInput {
    userId: String
    name: String
    location: String
    username: String
    otherUsernames: Json
    links: Json
    about: Json
    info: Json
    photo: ID
    isTeam: Boolean
  }

  input ToolInput {
    toolId: ID
    name: String
    url: String
    about: Json
    creatorId: ID
    tags: [String]
    image: ID
  }

  input MediaInput {
    mediaId: ID
    name: String
    mediaUrl: String
    slug: String
    description: Json
    links: Json
    userId: ID
    coverImageFileId: ID
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
    coverImageFileId: ID
    mediaItems: [ID]
    metadata: Json
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
    logoutSession(clientId: ID): Int
    logoutEverywhereElse: Int
    logoutEverywhere: Int
    signup(user: UserInput!, email: String, password: String!): User

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

    uploadFile(file: Upload!): HostedFile
    uploadMultipleFiles(files: [Upload!]!): [HostedFile]

    addEmailAddress(userId: ID!, email: String!, makePrimary: Boolean): Email
    addPhoneNumber(userId: ID!, number: String!, makePrimary: Boolean): Phone
    confirmEmailAddress(userId: ID!, email: String!, code: String!): Email
    confirmPhoneNumber(userId: ID!, number: String!, code: String!): Phone
    setPrimaryEmail(userId: ID!, email: String!): Email
    setPrimaryPhoneNumber(userId: ID!, number: String!): Phone
    removeEmailAddress(userId: ID!, email: String): Null
    removePhoneNumber(userId: ID!, number: String): Null

    setUserPhoto(userId: ID!, file: Upload): HostedFile

    addPlaylistMediaItem(playlistId: ID!, mediaId: ID!, toBeginning: Boolean): Playlist
    removePlaylistMediaItem(playlistId: ID!, mediaId: ID!): Playlist

  }
`;
