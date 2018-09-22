let auth = require('./auth');
let ClientError = require('./ClientError');
let model = require('./model');
let signup = require('./signup');

function assertIsLoggedInAs(context, userId) {
  if (context.userId === userId) {
    return;
  } else {
    throw ClientError("You don't have permission to do that", 'NO_PERMISSION');
  }
}

module.exports = {
  Query: {
    inspect: (obj, args, context, info) => {
      return JSON.stringify({
        obj,
        // args,
        // context,
        info,
      });
    },
    hello: (_, { name }, context) => {
      return `Hello ${name || 'World'}`;
    },
    media: async (_, { mediaId }, context) => {
      return await context.loaders.media.load(mediaId);
    },
    user: async (_, { userId }, context) => {
      return await context.loaders.user.load(userId);
    },
    userByUsername: async (_, { username }) => {
      return await model.getUserByUsernameAsync(username);
    },
    engine: async (_, { engineId }, context) => {
      return await context.loaders.engine.load(engineId);
    },
    playlist: async (_, { playlistId }, context) => {
      return await context.loaders.playlist.load(playlistId);
    },
    playlistsForUser: async (_, { userId }) => {
      return await model.getPlaylistsForUser(userId);
    },
    currentPlaylist: async (_, {}, context) => {
      let playlist = await context.loaders.playlist.load('playlist:ludum-dare-42');
      let playlist_ = { ...playlist };
      playlist_.mediaItems = playlist_.mediaItems.slice(0);
      let shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]]; // eslint-disable-line no-param-reassign
        }
        return a;
      };
      shuffle(playlist_.mediaItems);
      return playlist_;
    },
  },
  Media: {
    user: async (media, {}, context, info) => {
      return await context.loaders.user.load(media.userId);
    },
    engine: async (media, {}, context, info) => {
      return await context.loaders.engine.load(media.engineId);
    },
  },
  User: {
    members: async (team, {}, context, info) => {
      if (team.roles && team.roles.members) {
        return await context.loaders.user.loadMany(team.roles.members);
      } else {
        return null;
      }
    },
    admins: async (team, {}, context, info) => {
      if (team.roles && team.roles.admins) {
        return await context.loaders.user.loadMany(team.roles.admins);
      } else {
        return null;
      }
    },
  },
  Playlist: {
    mediaItems: async (playlist, {}, context, info) => {
      return await context.loaders.media.loadMany(playlist.mediaItems);
    },
  },
  Mutation: {
    updateUser: async (_, { userId, user }, context, info) => {
      assertIsLoggedInAs(context, userId);
      let update = {
        userId,
      };
      for (let k in user) {
        if (k === 'about' || k === 'photo') {
          update[k] = JSON.stringify(user[k]);
        } else {
          update[k] = user[k];
        }
      }
      console.log(update);
      await model.updateUserAsync(update);
      return await context.loaders.user.load(userId);
    },
    login: async (_, { usernameOrSimilar, password }, context, info) => {
      return await auth.loginAsync(context.clientId, usernameOrSimilar, password, {
        createdIp: context.request.ip,
      });
    },
    logout: async (_, {}, context, info) => {
      await auth.logoutAsync(context.clientId);
      return null;
    },
    signup: async (_, { user }, context, info) => {
      console.log("s1");
      let createdUser = await signup.signupAsync(user);
      console.log("s2");

      // Log them in
      await model.startSessionAsync({
        clientId: context.clientId,
        userId: createdUser.userId,
        createdIp: context.request.ip,
      });

      return createdUser;
    },
  },
};
