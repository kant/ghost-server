const DB = require('~/utils/db');
const Password = require('~/utils/password');
const Permissions = require('~/utils/permissions');
let _ = require('lodash');

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

    updateUser(userId: ID!, user: UserInput): User
  }

  input UserInput {
    userId: String
    name: String
    about: Json
    photoFileId: ID
    websiteUrl: String
    twitterUsername: String
    itchUsername: String

    # Unused by client
    location: String
    otherUsernames: Json
    username: String # Can only change name, not username
    links: Json
    info: Json
    githubUsername: String
    twitchUsername: String
    isTeam: Boolean
  }

  type Userplay {
    userplayId: ID
    userId: ID
    mediaId: ID
    mediaUrl: String
    media: Media
    startTime: Datetime
    imputedEndTime: Datetime
    active: Boolean
    createdTime: Datetime
    updatedTime: Datetime

    # Unused by client
    publicId: ID
    playId: ID
    lastPingTime: Datetime
    endTime: Datetime
    duration: Int
    notes: Json
  }

  type User {
    userId: ID!
    name: String
    username: String
    about: Json
    photo: HostedFile
    websiteUrl: String
    twitterUsername: String
    itchUsername: String
    mediaItems: [Media]
    mostRecentUserplay: Userplay
    createdTime: Datetime
    updatedTime: Datetime

    token: String # Only used with login/signup

    # Deprecated
    isReal: Boolean
    playlists: [Playlist]

    # Unused by client
    location: String
    links: Json
    githubUsername: String
    twitchUsername: String
    email: String
    phone: String # Primary phone number
  }
`;

const DB_FIELD_TO_GRAPHQL_FIELD = {
  user_id: 'userId',
  created_at: 'createdTime',
  updated_at: 'updatedTime',
  website_url: 'websiteUrl',
  twitter_username: 'twitterUsername',
  itch_username: 'itchUsername',
};

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
  _.forOwn(DB_FIELD_TO_GRAPHQL_FIELD, (graphqlName, dbName) => {
    user[graphqlName] = user[dbName];
    delete user[dbName];
  });
  return user;
}

async function graphqlUserToDBUserAsync(user) {
  _.forOwn(DB_FIELD_TO_GRAPHQL_FIELD, (graphqlName, dbName) => {
    user[dbName] = user[graphqlName];
    delete user[graphqlName];
  });

  if (user.username) {
    user.username_lower_case = user.username.toLowerCase();
  }

  if (user.email) {
    user.email_lower_case = user.email.toLowerCase();
  }

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

      if (userRow) {
        return await dbUserToGraphQLUserAsync(userRow);
      }
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
      user.email = email;

      let userRow = await DB('users')
        .insert(await graphqlUserToDBUserAsync(user))
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

    updateUser: async (_, { userId, user }, context) => {
      await Permissions.loginRequiredAsync(context);
      if (context.userId != userId) {
        throw new Error('bad credentials');
      }

      let userRow = await DB('users')
        .where('user_id', userId)
        .update(await graphqlUserToDBUserAsync(user))
        .returning('*')
        .get(0);

      return await dbUserToGraphQLUserAsync(userRow);
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
