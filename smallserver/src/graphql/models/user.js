const DB = require('~/utils/db');
const Password = require('~/utils/password');
const Permissions = require('~/utils/permissions');

const typeDefs = `
  extend type Query {
    user(userId: ID!): User
    me: User
    userForLoginInput(who: String!): User
    allUsers: [User]
  }

  extend type Mutation {
    login(userId: ID, password: String!): User
    signup(user: UserInput!, email: String, password: String!): User
    logout: Null
  }

  input UserInput {
    userId: String
    name: String
    location: String
    username: String
    links: Json
    about: Json
    info: Json
    photoFileId: ID
    isTeam: Boolean
    websiteUrl: String
    githubUsername: String
    twitterUsername: String
    itchUsername: String
    twitchUsername: String

    # Deprecated
    otherUsernames: Json
  }

  type Userplay {
    userplayId: ID
    userId: ID
    publicId: ID
    mediaId: ID
    mediaUrl: String
    media: Media
    playId: ID
    startTime: Datetime
    lastPingTime: Datetime
    imputedEndTime: Datetime
    endTime: Datetime
    duration: Int
    active: Boolean
    notes: Json
    createdTime: Datetime
    updatedTime: Datetime
  }

  type User {
    userId: ID!
    name: String
    location: String
    username: String
    about: Json
    links: Json
    photo: HostedFile
    websiteUrl: String
    githubUsername: String
    twitterUsername: String
    itchUsername: String
    twitchUsername: String
    createdTime: Datetime
    updatedTime: Datetime
    mediaItems: [Media]
    email: String # Primary email
    phone: String # Primary phone number
    mostRecentUserplay: Userplay
    token: String

    # Deprecated
    isReal: Boolean
    playlists: [Playlist]
  }
`;

async function userForIdAsync(userId) {
  return await DB('users')
    .where({ user_id: userId })
    .first();
}

async function userIdForTokenAsync(token) {
  try {
    let session = await DB('sessions')
      .where({ token })
      .first();
    return session.user_id;
  } catch (e) {
    return null;
  }
}

async function dbUserToGraphQLUserAsync(user) {
  user.userId = user.user_id;
  user.name = user.username; // TODO use real name
  user.createdTime = user.created_at;
  user.updatedTime = user.updated_at;
  return user;
}

const resolvers = {
  Query: {
    user: async (_, { userId }) => {
      return await dbUserToGraphQLUserAsync(await userForIdAsync(userId));
    },

    me: async (_, {}, context) => {
      await Permissions.loginRequiredAsync(context);
      return await dbUserToGraphQLUserAsync(await userForIdAsync(context.userId));
    },

    userForLoginInput: async (_, { who }) => {
      let userRow = null;
      try {
        userRow = await DB('users')
          .where({ email_lower_case: who.toLowerCase() })
          .first();
      } catch (e) {}

      if (!userRow) {
        try {
          userRow = await DB('users')
            .where({ username_lower_case: who.toLowerCase() })
            .first();
        } catch (e) {}
      }

      return await dbUserToGraphQLUserAsync(userRow);
    },

    allUsers: async () => {
      let users = await DB('users').select();
      for (let i = 0; i < users.length; i++) {
        users[i] = await dbUserToGraphQLUserAsync(users[i]);
      }
      return users;
    },
  },

  Mutation: {
    login: async (_, { userId, password }, context, info) => {
      let passwordRow = await DB('passwords')
        .where({ user_id: userId })
        .first();
      let success = await Password.checkPasswordAsync(password, passwordRow.hash);
      if (!success) {
        throw new Error('bad credentials');
      }

      let session = await DB('sessions')
        .insert({ user_id: userId })
        .returning('*')
        .get(0);
      let user = await userForIdAsync(userId);
      user.token = session.token;

      return await dbUserToGraphQLUserAsync(user);
    },

    signup: async (_, { user, password, email }, context, info) => {
      let userRow = await DB('users')
        .insert({
          username: user.username,
          username_lower_case: user.username.toLowerCase(),
          email: email,
          email_lower_case: email.toLowerCase(),
        })
        .returning('*')
        .get(0);
      let userId = userRow.user_id;

      await DB('passwords').insert({
        user_id: userId,
        hash: await Password.hashPasswordAsync(password),
      });

      let session = await DB('sessions')
        .insert({ user_id: userId })
        .returning('*')
        .get(0);
      userRow.token = session.token;

      return await dbUserToGraphQLUserAsync(userRow);
    },

    logout: async (_, {}, context) => {
      await Permissions.loginRequiredAsync(context);
      await DB('sessions')
        .where('token', context.token)
        .del();
    },
  },

  User: {
    isReal: () => {
      return true;
    },

    mediaItems: () => {
      return [];
    },

    playlists: () => {
      return [];
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
  userIdForTokenAsync,
};
