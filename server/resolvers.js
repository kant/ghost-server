let auth = require('./auth');
let ClientError = require('./ClientError');
let db = require('./db');
let data = require('./data');
let model = require('./model');
let permissions = require('./permissions');
let search = require('./search');
let signup = require('./signup');
let uploads = require('./uploads');
let validation = require('./validation');

function assertOrClientError(test, message, code) {
  if (!test) {
    throw ClientError(message, code);
  }
}

function addType(type, obj) {
  return {
    ...obj,
    __graphqlType: type,
  };
}

function NotImplementedError(message) {
  return ClientError(message || 'Not Implemented', 'NOT_IMPLEMENTED');
}

module.exports = {
  Query: {
    inspect: (obj, args, context, info) => {
      return JSON.stringify({
        // obj,
        // args,
        requestKeys: Object.keys(context.request),
        socket: Object.keys(context.request.socket),
        connection: Object.keys(context.request.connection),
        headers: context.request.headers,
        ip: context.request.ip,
        ips: context.request.ips,
        // info,
      });
    },
    hello: (_, { name }, context) => {
      return `Hello ${name || 'World'}`;
    },

    env: async (_, {}, context) => {
      let result = await db.queryAsync(`SELECT "value" FROM "env" WHERE "var" = 'env';`);
      if (result.rowCount > 0) {
        return result.rows[0].value;
      }
    },
    me: async (_, {}, context) => {
      if (context.userId) {
        return await context.loaders.user.load(context.userId);
      }
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
      let playlist = await context.loaders.playlist.load('playlist:badboxart2018');
      let playlist_ = { ...playlist };
      playlist_.mediaItems = playlist_.mediaItems.slice(0);
      let shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]]; // eslint-disable-line no-param-reassign
        }
        return a;
      };
      // shuffle(playlist_.mediaItems);
      return playlist_;
    },
    search: async (_, { query, cursorPosition, limit }, context) => {
      return await search.queryAsync(query, cursorPosition, { limit });
    },
    searchMediaAndPlaylists: async (_, { query, cursorPosition, limit }, context) => {
      return await search.queryJustMediaAndPlaylistsAsync(query, cursorPosition, { limit });
    },
    allUsers: async (_, { limit }, context) => {
      return await context.loaders.user.loadMany(await model.allUserIdsAsync({ limit }));
    },
    allMedia: async (_, { limit }, context) => {
      return await context.loaders.media.loadMany(await model.allMediaIdsAsync({ limit }));
    },
    allTools: async (_, { limit }, context) => {
      return await context.loaders.tool.loadMany(await model.allToolIdsAsync({ limit }));
    },
    allPlaylists: async (_, { limit }, context) => {
      return await context.loaders.playlist.loadMany(await model.allPlaylistIdsAsync({ limit }));
    },
    allTags: async () => {
      throw NotImplementedError();
    },
    allTeams: async () => {
      throw NotImplementedError();
    },
    subscriptions: async (_, { fromId }, context) => {
      return await context.loaders.subscriptions.load(fromId);
    },
    subscribers: async (_, { toId }, context) => {
      return await context.loaders.subscribers.load(toId);
    },
    subscriptionCount: async (_, { fromId }, context) => {
      return await context.loaders.subscriptionCount.load(fromId);
    },
    subscriberCount: async (_, { toId }, context) => {
      return await context.loaders.subscriberCount.load(toId);
    },
  },
  MediaAndPlaylistSearchResults: {
    mediaItems: async (results, {}, context) => {
      return await context.loaders.media.loadMany(results.mediaResults.map((x) => x.id));
    },
    playlistItems: async (results, {}, context) => {
      return await context.loaders.playlist.loadMany(results.playlistResults.map((x) => x.id));
    },
    playlists: async (results, {}, context) => {
      return await context.loaders.playlist.loadMany(results.playlistResults.map((x) => x.id));
    },
    recommendedItems: async (results, {}, context) => {
      return await context.loaders.media.loadMany(results.recommendedResults.map((x) => x.id));
    },
  },
  Media: {
    user: async (media, {}, context, info) => {
      return media.userId && (await context.loaders.user.load(media.userId));
    },
    tags: async (media, {}, context) => {
      return data.setToList(media.tagSet);
    },
    tools: async (media, {}, context, info) => {
      let toolIds = data.setToList(media.toolSet);
      return await context.loaders.tool.loadMany(toolIds);
    },
    toolIds: async (media, {}, context) => {
      return data.setToList(media.toolSet);
    },
  },
  SearchResult: {
    object: async (result, {}, context) => {
      switch (result.type) {
        case 'user':
          return addType('User', await context.loaders.user.load(result.id));
          break;
        case 'media':
          return addType('Media', await context.loaders.media.load(result.id));
          break;
        case 'playlist':
          return addType('Playlist', await context.loaders.playlist.load(result.id));
          break;
        case 'tool':
          return addType('Tool', await context.loaders.tool.load(result.id));
          break;
        case 'tag':
          return {
            __graphqlType: 'Tag',
            tag: result.id,
          };
          break;
        default:
          console.warn('Not sure how to resolve type `' + result.type + '`');
          return null;
          break;
      }
    },
  },
  SearchResultObject: {
    __resolveType: (obj) => {
      return obj.__graphqlType;
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
    subscribers: async (user, {}, context) => {
      return await context.loaders.subscribers.load(user.userId);
    },
    subscriptions: async (user, {}, context) => {
      return await context.loaders.subscriptions.load(user.userId);
    },
    subscriberCount: async (user, {}, context) => {
      return await context.loaders.subscriberCount.load(user.userId);
    },
    subscriptionCount: async (user, {}, context) => {
      return await context.loaders.subscriptionCount.load(user.userId);
    },
    mediaItems: async (user, {}, context) => {
      let mediaIdList = await context.loaders.mediaForUser.load(user.userId);
      let mediaItems = await context.loaders.media.loadMany(mediaIdList);
      return mediaItems;
    },
    playlists: async (user, {}, context) => {
      let playlistIdList = await context.loaders.playlistsForUser.load(user.userId);
      let playlists = await context.loaders.playlist.loadMany(playlistIdList);
      return playlists;
    },
  },
  Playlist: {
    mediaItems: async (playlist, {}, context, info) => {
      return await context.loaders.media.loadMany(playlist.mediaItems || []);
    },
    user: async (playlist, {}, context) => {
      if (playlist.userId) {
        return await context.loaders.user.load(playlist.userId);
      }
    },
  },
  Mutation: {
    User: async (_, { userId, username }, context) => {
      if (userId) {
        return await context.loaders.user.load(userId);
      } else if (username) {
        return await context.loaders.userByUsername.load(username);
      }
      return user;
    },
    Media: async (_, { mediaId }, context) => {
      return await context.loaders.media.load(mediaId);
    },
    Tool: async (_, { toolId }, context) => {
      return await context.loaders.tool.load(toolId);
    },
    Playlist: async (_, { playlistId }, context) => {
      return await context.loaders.playlist.load(playlistId);
    },
    login: async (_, { who, userId, username, password }, context, info) => {
      return await auth.loginAsync(context.clientId, { userId, username, who }, password, {
        createdIp: context.request.ip,
      });
    },
    logout: async (_, {}, context, info) => {
      await auth.logoutAsync(context.clientId);
      return null;
    },
    changePassword: async (_, { oldPassword, newPassword }, context, info) => {
      return await auth.changePasswordAsync(context.userId, oldPassword, newPassword);
    },
    signup: async (_, { user, password }, context, info) => {
      await permissions.hasClientIdAsync(context);
      let createdUserInfo = await signup.signupAsync(user, password);

      // Log them in
      await model.startSessionAsync({
        clientId: context.clientId,
        userId: createdUserInfo.userId,
        createdIp: context.request.ip,
      });

      return await context.loaders.user.load(createdUserInfo.userId);
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
    addMedia: async (_, { media }, context) => {
      await permissions.canAddMediaAsync(context, media);
      let media_ = { ...media };
      if (!media_.userId) {
        media_.userId = context.userId;
      }
      let newMedia = await model.newMediaAsync(media_);
      return await context.loaders.media.load(newMedia.mediaId);
    },
    updateMedia: async (_, { mediaId, media }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let media_ = { ...media };
      media_.mediaId = mediaId;
      let newMedia = await model.updateMediaAsync(media_);
      return await context.loaders.media.load(mediaId);
    },
    deleteMedia: async (_, { mediaId }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      return await model.deleteMediaAsync(mediaId);
    },
    addMediaTags: async (_, { mediaId, tags, tag }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let tagList = data.combinePluralAndSingular(tags, tag);
      await validation.validateTagListAsync(tagList);
      await model.addMediaTagsAsync(mediaId, tagList);
      return await context.loaders.media.load(mediaId);
    },
    removeMediaTags: async (_, { mediaId, tags, tag }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let tagList = data.combinePluralAndSingular(tags, tag);
      await validation.validateTagListAsync(tagList);
      await model.removeMediaTagsAsync(mediaId, tagList);
      return await context.loaders.media.load(mediaId);
    },
    addMediaTools: async (_, { mediaId, toolId, toolIds }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let toolIdList = data.combinePluralAndSingular(toolIds, toolId);
      await model.addMediaToolsAsync(mediaId, toolIdList);
      return await context.loaders.media.load(mediaId);
    },
    removeMediaTools: async (_, { mediaId, toolId, toolIds }, context) => {
      await permissions.canUpdateMediaAsync(context, mediaId);
      let toolIdList = data.combinePluralAndSingular(toolIds, toolId);
      await model.removeMediaToolsAsync(mediaId, toolIdList);
      return await context.loaders.media.load(mediaId);
    },
    addPlaylist: async (_, { playlist }, context) => {
      await permissions.canAddPlaylistAsync(context);
      let playlist_ = await model.addPlaylistAsync({
        ...playlist,
        userId: context.userId,
      });
      return await context.loaders.playlist.load(playlist_.playlistId);
    },
    updatePlaylist: async (_, { playlistId, playlist }, context) => {
      await permissions.canUpdatePlaylistAsync(context, playlistId);
      let playlist_ = { ...playlist, playlistId };
      await model.updatePlaylistAsync(playlist_);
      return await context.loaders.playlist.load(playlistId);
    },
    deletePlaylist: async (_, { playlistId }, context) => {
      await permissions.canDeletePlaylistAsync(context, playlistId);
      return await model.deletePlaylistAsync(playlistId);
    },
    subscribe: async (_, { fromId, toId }, context) => {
      fromId = fromId || context.userId;
      await permissions.canSubscribeToUserAsync(context, { fromId, toId });
      return await model.subscribeAsync(fromId, toId);
    },
    unsubscribe: async (_, { fromId, toId }, context) => {
      fromId = fromId || context.userId;
      await permissions.canUnsubscribeFromUserAsync(context, { fromId, toId });
      return await model.unsubscribeAsync(fromId, toId);
    },
    me: async (_, {}, context) => {
      if (context.userId) {
        return await context.loaders.user.load(context.userId);
      }
    },
    singleUpload: async (_, { file }, context) => {
      console.log('singleUpload', { file });
      let createdFile = await uploads.storeUploadAsync(file, {
        userId: context.userId,
        uploadIp: context.ip,
      });
      console.log('singleUpload', { createdFile });
      return createdFile;
    },
    tripleUpload: async (_, { file1, file2, file3 }, context) => {
      console.log('tripleUpload', file1, file2, file3);
    },
  },
  MediaMutation: {
    update: async (media, { update }, context) => {},
    delete: async (media, {}, context) => {},
    addTags: async (media, { tagList }, context) => {},
    removeTags: async (media, { tagList }, context) => {},
    addTools: async (media, { toolIdList }, context) => {},
    removeTools: async (media, { toolIdList }, context) => {},
  },
  PlaylistMutation: {
    update: async (playlist, { update }, context) => {},
    delete: async (playlist, {}, context) => {},
  },
  ToolMutation: {
    update: async (tool, { update }, context) => {},
    delete: async (tool, {}, context) => {},
  },
  UserMutation: {
    convertToTeam: async (user, {}, context) => {
      await permissions.canUpdateUserAsync(context, user.userId);
      await model.convertUserToTeamAsync(user.userId);
      context.loaders.user.clear(user.userId);
      return await context.loaders.user.load(user.userId);
    },
    convertToUser: async (user, {}, context) => {
      await permissions.canUpdateUserAsync(context, user.userId);
      await model.convertTeamToUserAsync(user.userId);
      context.loaders.user.clear(user.userId);
      return await context.loaders.user.load(user.userId);
    },
    update: async (user, { update }, context) => {
      await permissions.canUpdateUserAsync(context, user.userId);
      let update_ = { ...update, userId: user.userId };
      await model.updateUserAsync(update_);
      context.loaders.user.clear(user.userId);
      return await context.loaders.user.load(user.userId);
    },
    delete: async (user, {}, context) => {
      await permissions.canDeleteUserAsync(context, user.userId);
      await model._deleteUserAsync(user.userId);
      context.loaders.user.clear(user.userId);
      return await context.loaders.user.load(user.userId);
    },
    addTeamMembers: async (team, { userIdList }, context) => {
      assertOrClientError(
        !!team.isTeam,
        "Can't change members of a user that isn't a team",
        'NOT_A_TEAM'
      );
      await permissions.canUpdateUserAsync(context, team.userId);
      await model.addTeamMembersAsync(team.userId, userIdList);
      context.loaders.user.clear(team.userId);
      return await context.loaders.user.load(team.userId);
    },
    removeTeamMembers: async (team, { userIdList }, context) => {
      assertOrClientError(
        !!team.isTeam,
        "Can't change members of a user that isn't a team",
        'NOT_A_TEAM'
      );
      await permissions.canUpdateUserAsync(context, team.userId);
      await model.removeTeamMembersAsync(team.userId, userIdList);
      context.loaders.user.clear(team.userId);
      return await context.loaders.user.load(team.userId);
    },
    addTeamAdmins: async (team, { userIdList }, context) => {
      assertOrClientError(
        !!team.isTeam,
        "Can't change admins of a user that isn't a team",
        'NOT_A_TEAM'
      );
      await permissions.canUpdateUserAsync(context, team.userId);
      await model.addTeamAdminsAsync(team.userId, userIdList);
      context.loaders.user.clear(team.userId);
      return await context.loaders.user.load(team.userId);
    },
    removeTeamAdmins: async (team, { userIdList }, context) => {
      assertOrClientError(
        !!team.isTeam,
        "Can't change admins of a user that isn't a team",
        'NOT_A_TEAM'
      );
      await permissions.canUpdateUserAsync(context, team.userId);
      await model.removeTeamAdminsAsync(team.userId, userIdList);
      context.loaders.user.clear(team.userId);
      return await context.loaders.user.load(team.userId);
    },
  },
};
