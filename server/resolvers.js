let auth = require('./auth');
let ClientError = require('./ClientError');
let data = require('./data');
let model = require('./model');
let permissions = require('./permissions');
let signup = require('./signup');

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
    whoAmI: async (_, {}, context) => {
      if (context.userId) {
        return await context.loaders.user.load(context.userId);
      }
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
    tags: async (media, {}, context, info) => {
      if (media.tags) {
        return Object.keys(tags);
      } else {
        return [];
      }
    },
  },
  User: {
    members: async (team, {}, context, info) => {
      if (team.isTeam && team.members) {
        return await context.loaders.user.loadMany(Object.keys(team.members));
      }
      if (team.isTeam) {
        return [];
      }
    },
    admins: async (team, {}, context, info) => {
      if (team.isTeam && team.admins) {
        return await context.loaders.user.loadMany(Object.keys(team.admins));
      }
      if (team.isTeam) {
        return [];
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
      await permissions.canUpdateUserAsync(context, userId);
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
      let createdUser = await signup.signupAsync(user);

      // Log them in
      await model.startSessionAsync({
        clientId: context.clientId,
        userId: createdUser.userId,
        createdIp: context.request.ip,
      });

      return await context.loaders.user.load(createdUser.userId);
    },
    addEngine: async (_, { engine }, context, info) => {
      await permissions.canAddEngineAsync(context);
      let engine_ = data.stringifyJsonFields(engine, model.jsonFields.engine);
      let newEngine = await model.newEngineAsync(engine_);
      return await context.loaders.engine.load(newEngine.engineId);
    },
    updateEngine: async (_, { engineId, engine }, context, info) => {
      await permissions.canUpdateEngineAsync(context, engineId);
      let engine_ = data.stringifyJsonFields(engine, model.jsonFields.engine);
      engine_.engineId = engineId;
      await model.updateEngineAsync(engine_);
      return await context.loaders.engine.load(engine_.engineId);
    },
    deleteEngine: async (_, { engineId }, context) => {
      await permissions.canUpdateEngineAsync(context, engineId);
      return await model.deleteEngineAsync(engineId);
    },
    addMedia: async (_, { media }, context, info) => {
      await permissions.canAddMediaAsync(context);
      let media_ = data.stringifyJsonFields(media, model.jsonFields.media);
      let newMedia = await model.newMediaAsync(media_);
      return await context.loaders.media.load(newMedia.mediaId);
    },
    updateMedia: async (_, { mediaId, media }, context, info) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let media_ = data.stringifyJsonFields(media, model.jsonFields.media);
      let newMedia = await model.updateMediaAsync(media_);
      return await context.loaders.media.load(newMedia.mediaId);
    },
    deleteMedia: async (_, { mediaId }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      return await model.deleteMediaAsync(mediaId);
    },
    addTeamMember: async (_, { teamId, userId }, context) => {
      await permissions.canUpdateUserAsync(context, teamId);
      await model.addTeamMembersAsync(teamId, [userId]);
      return await context.loaders.user.load(teamId);
    },
    addTeamMembers: async (_, { teamId, userIdList }, context) => {
      await permissions.canUpdateUserAsync(context, teamId);
      await model.addTeamMembersAsync(teamId, userIdList);
      return await context.loaders.user.load(teamId);
    },
    removeTeamMember: async (_, { teamId, userId }, context) => {
      await permissions.canUpdateUserAsync(context, teamId);
      await model.removeTeamMembersAsync(teamId, [userId]);
      return await context.loaders.user.load(teamId);
    },
    removeTeamMembers: async (_, { teamId, userIdList }, context) => {
      await permissions.canUpdateUserAsync(context, teamId);
      await model.removeTeamMembersAsync(teamId, userIdList);
      return await context.loaders.user.load(teamId);
    },
    addTeamAdmin: async (_, { teamId, userId }, context) => {
      await permissions.canUpdateTeamAdminsAsync(context, teamId);
      await model.addTeamAdminsAsync(teamId, [userId]);
      return await context.loaders.user.load(teamId);
    },
    addTeamAdmins: async (_, { teamId, userIdList }, context) => {
      await permissions.canUpdateTeamAdminsAsync(context, teamId);
      await model.addTeamAdminsAsync(teamId, userIdList);
      return await context.loaders.user.load(teamId);
    },
    removeTeamAdmin: async (_, { teamId, userId }, context) => {
      await permissions.canUpdateTeamAdminsAsync(context, teamId);
      await model.removeTeamAdminsAsync(teamId, [userId]);
      return await context.loaders.user.load(teamId);
    },
    removeTeamAdmins: async (_, { teamId, userIdList }, context) => {
      await permissions.canUpdateTeamAdminsAsync(context, teamId);
      await model.removeTeamAdminsAsync(teamId, userIdList);
      return await context.loaders.user.load(teamId);
    },
    convertUserToTeam: async (_, { userId, adminUserIdList }, context) => {
      await permissions.canUpdateUserAsync(context, userId);
      await model.convertUserToTeamAsync(userId, adminUserIdList);
      return await context.loaders.user.load(userId); // (now a teamId)
    },
    convertTeamToUser: async (_, { teamId }, context) => {
      await permissions.canUpdateTeamAdminsAsync(context, teamId);
      await model.convertTeamToUserAsync(teamId);
      return await context.loaders.user.load(teamId); // (now a userId)
    },
  },
};
