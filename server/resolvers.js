let assert = require('assert');

let auth = require('./auth');
let data = require('./data');
let model = require('./model');
let permissions = require('./permissions');
let search = require('./search');
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
    tool: async (_, { toolId }, context) => {
      return await context.loaders.tool.load(toolId);
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
    search: async (_, { query, cursorPosition, limit }, context) => {
      return await search.queryAsync(query, cursorPosition, { limit });
    },
  },
  Media: {
    user: async (media, {}, context, info) => {
      return await context.loaders.user.load(media.userId);
    },
    tools: async (media, {}, context, info) => {
      return await context.loaders.tool.load(media.toolIds);
    },
  },
  Tool: {
    tags: async (tool, {}, context, info) => {
      if (tool.tagSet) {
        return Object.keys(tool.tagSet);
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
      let user_ = data.stringifyJsonFields(user, model.jsonFields.user);
      user_.userId = userId;
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
    addTool: async (_, { tool }, context, info) => {
      await permissions.canAddToolAsync(context);
      let tool_ = data.stringifyJsonFields(tool, model.jsonFields.tool);
      if (tool.tags) {
        tool_.tagSet = JSON.stringify(data.listToSet(tool.tags));
        delete tool_.tags;
      }
      let newTool = await model.newToolAsync(tool_);
      return await context.loaders.tool.load(newTool.toolId);
    },
    updateTool: async (_, { toolId, tool }, context, info) => {
      await permissions.canUpdateToolAsync(context, toolId);
      let tool_ = data.stringifyJsonFields(tool, model.jsonFields.tool);
      if (tool_.tags) {
        tool_.tagSet = JSON.stringify(data.listToSet(tool_.tags));
        delete tool_.tags;
      }
      tool_.toolId = toolId;
      await model.updateToolAsync(tool_);
      return await context.loaders.tool.load(tool_.toolId);
    },
    deleteTool: async (_, { toolId }, context) => {
      await permissions.canDeleteToolAsync(context, toolId);
      return await model.deleteToolAsync(toolId);
    },
    addMedia: async (_, { media }, context, info) => {
      await permissions.canAddMediaAsync(context);
      let media_ = data.stringifyJsonFields(media, model.jsonFields.media);
      if (media_.tags) {
        media_.tags = JSON.stringify(data.listToSet(media_.tags));
      }
      let newMedia = await model.newMediaAsync(media_);
      return await context.loaders.media.load(newMedia.mediaId);
    },
    updateMedia: async (_, { mediaId, media }, context, info) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let media_ = data.stringifyJsonFields(media, model.jsonFields.media);
      if (media_.tags) {
        media_.tags = JSON.stringify(data.listToSet(media_.tags));
      }
      media_.mediaId = mediaId;
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
    addMediaTags: async (_, { mediaId, tags, tag }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let tagList = data.combinePluralAndSingular(tags, tag);
      await model.addMediaTagsAsync(mediaId, tagList);
      return await context.loaders.media.load(mediaId);
    },
    removeMediaTags: async (_, { mediaId, tags, tag }, context) => {
      await permissions.canUpdateMediaAsync(context, medaiId);
      let tagList = data.combinePluralAndSingular(tags, tag);
      await model.removeMediaTagsAsync(mediaId, tagList);
      return await context.loaders.media.load(mediaId);
    },
  },
};
