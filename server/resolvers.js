let auth = require('./auth');
let ClientError = require('./ClientError');
let db = require('./db');
let data = require('./data');
let emaillib = require('./emaillib');
let sms = require('./sms');
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
    _debugInfo: (obj, args, context, info) => {
      return {
        // obj,
        // args,
        requestKeys: Object.keys(context.request),
        socket: Object.keys(context.request.socket),
        connection: Object.keys(context.request.connection),
        headers: context.request.headers,
        ip: context.request.ip,
        ips: context.request.ips,
        // info,
      };
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
    fileInfo: async (_, { fileId }, context) => {
      return await context.loaders.file.load(fileId);
    },
    me: async (_, {}, context) => {
      if (context.userId) {
        return await context.loaders.user.load(context.userId);
      }
    },
    media: async (_, { mediaId }, context) => {
      return await context.loaders.media.load(mediaId);
    },
    mediaByMediaUrl: async (_, { mediaUrl }, context) => {
      return await context.loaders.mediaByMediaUrl.load(mediaUrl);
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
      // let playlist = await context.loaders.playlist.load('playlist:badboxart2018');
      let playlist = await context.loaders.playlist.load('playlist:ghost-games');
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
    search: async (_, { query, cursorPosition, types, limit }, context) => {
      return await search.queryAsync(query, cursorPosition, { limit, types });
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
    sessionInfoForClientIds: async (_, { clientIdList }, context) => {
      return await context.loaders.sessionInfo.loadMany(clientIdList);
    },
    userForLoginInput: async (_, { who }, context) => {
      return await auth.getUserForLoginAsync({ who });
    },
    validateSignup: async (_, { inputs }, context) => {
      return await validation.validateSignupAsync({ context, inputs });
    },
  },
  SessionInfo: {
    user: async (obj, {}, context) => {
      if (obj.userId) {
        return await context.loaders.user.load(obj.userId);
      }
    },
  },
  HostedFile: {
    user: async (obj, {}, context) => {
      if (obj.userId) {
        return await context.loaders.user.load(obj.userId);
      }
    },
    originUrl: async (obj, {}, context) => {
      if (obj.fileId) {
        return context.request.baseUrl + '/origin/' + obj.fileId;
      }
    },
    imgixUrl: async (obj, {}, context) => {
      if (obj.fileId) {
        return 'https://castle.imgix.net/' + obj.fileId;
      }
    },
    url: async () => {
      return null;
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
    coverImage: async (media, {}, context) => {
      if (media.coverImageFileId) {
        return await context.loaders.file.load(media.coverImageFileId);
      }
    },
    jamPlaylistId: async (media, {}, context, info) => {},
    jamPlaylist: async (media, {}, context, info) => {},
    jamVotingUrl: async (media, {}, context, info) => {
      return null;
      let mediaId = media.mediaId;
      let procjamPlaylist = await context.loaders.playlist.load('playlist:procjam-2018');
      let mediaItemIds = procjamPlaylist.mediaItems;
      for (let x of mediaItemIds) {
        if (mediaId === x) {
          return 'https://itch.io/jam/procjam/entries';
        }
      }
      return null;
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
    isReal: async (user, {}, context) => {
      return !!(
        !user.importedFromAnotherSite ||
        (user.importedFromAnotherSite && user.claimedByUser)
      );
    },
    emailAddresses: async (user, {}, context) => {
      await permissions.canSeeContactInfoAsync(context, user.userId);
      let emails = await context.loaders.email.load(user.userId);
      // TODO(ccheever): Sort by primary
      return emails;
    },
    phoneNumbers: async (user, {}, context) => {
      await permissions.canSeeContactInfoAsync(context, user.userId);
      let phoneNumbers = await context.loaders.phone.load(user.userId);
      // TODO(ccheever): Sort by primary
      return phoneNumbers;
    },
    email: async (user, {}, context) => {
      await permissions.canSeeContactInfoAsync(context, user.userId);
      let emails = await context.loaders.email.load(user.userId);
      if (emails) {
        for (let email of emails) {
          if (email.isPrimary) {
            return email.email;
          }
        }
        // if we don't have any primary e-mail, let's
        // just pick one, as long as its not commandeered
        if (emails.length > 0) {
          if (!emails[0].commandeered) {
            return emails[0].email;
          }
        }
      }
    },
    phone: async (user, {}, context) => {
      await permissions.canSeeContactInfoAsync(context, user.userId);
      let phoneNumbers = await context.loaders.phone.load(user.userId);
      if (phoneNumbers) {
        for (let phone of phoneNumbers) {
          if (phone.isPrimary) {
            return phone.number;
          }
        }

        // If there are no numbers marked as the primary
        // phone number, just use the first one, as long
        // as its not commandeered
        if (phoneNumbers.length > 0) {
          if (!phoneNumbers[0].commandeered) {
            return phoneNumbers[0].number;
          }
        }
      }
    },
    photo: async (user, {}, context) => {
      if (user.photoFileId) {
        return await context.loaders.file.load(user.photoFileId);
      }
    },
  },
  Playlist: {
    mediaItems: async (playlist, {}, context, info) => {
      let mediaItems = await context.loaders.media.loadMany(playlist.mediaItems || []);
      // for (let i = 0; i < playlist.mediaItems.length; i++) {
      //   if (!mediaItems[i]) {
      //     console.error(`Missing mediaItem: ${playlist.mediaItems[i]} from ${playlist.playlistId}`);
      //   }
      // }
      return mediaItems.filter((x) => x && !x.deleted);
    },
    user: async (playlist, {}, context) => {
      if (playlist.userId) {
        return await context.loaders.user.load(playlist.userId);
      }
    },
    coverImage: async (playlist, {}, context, info) => {
      if (playlist.coverImageFileId) {
        return await context.loaders.file.load(playlist.coverImageFileId);
      } else {
        // Return a random coverImage from one of the media items in the list
        // if any exists
        let mediaItems = await context.loaders.media.loadMany(playlist.mediaItems || []);
        let coverImageFileIdList = mediaItems
          .map((x) => x && x.coverImageFileId)
          .filter((x) => !!x);
        if (coverImageFileIdList.length) {
          let fileId =
            coverImageFileIdList[Math.floor(Math.random() * coverImageFileIdList.length)];
          return await context.loaders.file.load(fileId);
        }
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
    logoutSession: async (_, { clientId }, context, info) => {
      return await auth.logoutAsync(clientId);
    },
    logoutEverywhere: async (_, {}, context, info) => {
      await permissions.loginRequiredAsync(context);
      return await auth.logoutEverywhereAsync(context.userId);
    },
    logoutEverywhereElse: async (_, {}, context, info) => {
      await permissions.loginRequiredAsync(context);
      return await auth.logoutEverywhereElseAsync(context.userId, context.clientId);
    },
    changePassword: async (_, { oldPassword, newPassword }, context, info) => {
      return await auth.changePasswordAsync(context.userId, oldPassword, newPassword);
    },
    signup: async (_, { user, password, email }, context, info) => {
      await permissions.hasClientIdAsync(context);
      let createdUserInfo = await signup.signupAsync(user, password);

      // Log them in
      await model.startSessionAsync({
        clientId: context.clientId,
        userId: createdUserInfo.userId,
        createdIp: context.request.ip,
      });

      // This seems dangerous but also correct?
      // Possibly should just have a method that allows us to rebuild the context?
      context.userId = createdUserInfo.userId;

      if (email) {
        await emaillib.addNewEmailAddressAsync(createdUserInfo.userId, email, {
          makePrimary: true,
        });
      }

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
    uploadFile: async (_, { file }, context) => {
      let createdFile = await uploads.storeUploadAsync(file, {
        userId: context.userId,
        uploadIp: context.request.ip,
      });
      return await context.loaders.file.load(createdFile.fileId);
    },
    setUserPhoto: async (_, { userId, file, fileId, empty }, context) => {
      await permissions.canUpdateUserAsync(context, userId);
      let createdFile = await uploads.storeUploadAsync(file, {
        userId: context.userId,
        uploadIp: context.request.ip,
      });
      if (!(createdFile.height && createdFile.width)) {
        throw ClientError("Couldn't determine height and width of image", 'IMAGE_ERROR');
      }
    },
    uploadMultipleFiles: async (_, { files }, context) => {
      let a$ = [];
      for (let file of files) {
        a$.push(
          uploads.storeUploadAsync(file, {
            userId: context.userId,
            uploadIp: context.request.ip,
          })
        );
      }
      let createdFiles = await Promise.all(a$);
      return await context.loaders.file.loadMany(createdFiles.map((x) => x.fileId));
    },
    addEmailAddress: async (_, { userId, email, makePrimary }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      return await emaillib.addNewEmailAddressAsync(userId, email, { makePrimary });
    },
    addPhoneNumber: async (_, { userId, number, makePrimary }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      return await sms.addNewPhoneNumberAsync(userId, number, { makePrimary });
    },
    confirmEmailAddress: async (_, { userId, email, code }, context) => {
      await permissions.canConfirmContactInfoAsync(context, userId);
      let nEmail = emaillib.normalize(email);
      let success = await emaillib.confirmEmailAsync(userId, nEmail, code);
      if (success) {
        return await model.getEmailInfoAsync(userId, nEmail);
      }
    },
    confirmPhoneNumber: async (_, { userId, number, code }, context) => {
      await permissions.canConfirmContactInfoAsync(context, userId);
      let nNumber = sms.normalize(number);
      let success = await sms.confirmPhoneNumberAsync(userId, nNumber, code);
      if (success) {
        return model.getPhoneNumberInfoAsync(userId, nNumber);
      }
    },
    setPrimaryEmail: async (_, { userId, email }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      let nEmail = emaillib.normalize(email);
      await emaillib.setPrimaryEmailAsync(userId, nEmail);
      return await model.getEmailInfoAsync(userId, nEmail);
    },
    setPrimaryPhoneNumber: async (_, { userId, number }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      let nNumber = sms.normalize(number);
      await sms.setPrimaryPhoneNumberAsync(userId, nNumber);
      return await model.getPhoneNumberInfoAsync(userId, nNumber);
    },
    removeEmailAddress: async (_, { userId, email }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      let nEmail = emaillib.normalize(email);
      await emaillib.removeEmailAddressAsync(userId, nEmail);
    },
    removePhoneNumber: async (_, { userId, number }, context) => {
      await permissions.canUpdateContactInfoAsync(context, userId);
      let nNumber = sms.normalize(number);
      await sms.removePhoneNumberAsync(userId, nNumber);
    },
    addPlaylistMediaItem: async (_, { playlistId, mediaId, toBeginning }, context) => {
      await permissions.canUpdatePlaylistAsync(context, playlistId);
      await model.addPlaylistMediaItemAsync(playlistId, mediaId, { toBeginning });
      return await context.loaders.playlist.load(playlistId);
    },
    removePlaylistMediaItem: async (_, { playlistId, mediaId }, context) => {
      await permissions.canUpdatePlaylistAsync(context, playlistId);
      await model.removePlaylistMediaItemAsync(playlistId, mediaId);
      return await context.loaders.playlist.load(playlistId);
    },
    recordUserplayStart: async (_, { userplayId, mediaId, mediaUrl }, context) => {
      assertOrClientError(
        userplayId.startsWith('userplay:'),
        'userplayId must start with `userplay:`'
      );
      await permissions.canRecordUserplayAsync(context, userplayId);
      await model.recordUserplayStartAsync(
        context.clientId,
        context.userId,
        userplayId,
        mediaId,
        mediaUrl
      );
      return await context.loaders.userplay.load(userplayId);
    },
    recordUserplayEnd: async (_, { userplayId }, context) => {
      assertOrClientError(
        userplayId.startsWith('userplay:'),
        'userplayId must start with `userplay:`'
      );
      await permissions.canRecordUserplayAsync(context, userplayId);
      await model.recordUserplayEndAsync(context.clientId, context.userId, userplayId);
      return await context.loaders.userplay.load(userplayId);
    },
    updateUser: async (_, { userId, user }, context) => {
      await permissions.canUpdateUserAsync(context, userId);
      let update = { ...user, userId: userId };
      await model.updateUserAsync(update);
      context.loaders.user.clear(userId);
      return await context.loaders.user.load(userId);
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
