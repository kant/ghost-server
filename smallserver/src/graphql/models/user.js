const DB = require('~/utils/db');
const Password = require('~/utils/password');

const typeDefs = `
  extend type Query {
    user(userId: ID!): User
    userByUsername(username: String!): User
    me: User
    userForLoginInput(who: String!): User
  }

  extend type Mutation {
    login(userId: ID, password: String!): User
    signup(user: UserInput!, email: String, password: String!): User
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
    photoFileId: ID
    isTeam: Boolean
    websiteUrl: String
    githubUsername: String
    twitterUsername: String
    itchUsername: String
    twitchUsername: String
  }

  type User {
    userId: ID!
    name: String
    location: String
    username: String
    about: Json
    links: Json
    # photo: HostedFile
    websiteUrl: String
    githubUsername: String
    twitterUsername: String
    itchUsername: String
    twitchUsername: String
    createdTime: Datetime
    updatedTime: Datetime
    # mediaItems: [Media]
    email: String # Primary email
    phone: String # Primary phone number
    # mostRecentUserplay: Userplay
    token: String
  }
`;

async function userForIdAsync(id) {
  return await DB('users')
    .where({ id })
    .first();
}

const resolvers = {
  Query: {
    user: (userId) => {
      userForIdAsync(userId);
    },
    userByUsername: (username) => {},
    me: () => {},
    userForLoginInput: (who) => {},
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
        .returning('*');
      let user = await userForIdAsync(userId);
      user.token = session.token;

      return user;
    },

    signup: async (_, { user, password, email }, context, info) => {
      let userRow = await DB('users')
        .insert({
          username: user.username,
          username_lower_case: user.username.toLowerCase(),
          email: email,
          email_lower_case: email.toLowerCase(),
        })
        .returning('*');

      await DB('passwords').insert({
        user_id: userRow.id,
        hash: Password.hashPasswordAsync(password),
      });

      let session = await DB('sessions')
        .insert({ user_id: userId })
        .returning('*');
      userRow.token = session.token;

      return userRow;
    },
  },

  /*User: {
    mediaItems: (obj, args, context, info) => {},
  },*/
};

module.exports = {
  typeDefs,
  resolvers,
};
