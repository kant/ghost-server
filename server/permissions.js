let ClientError = require('./ClientError');
let model = require('./model');

function PermissionError(message) {
  return ClientError(message, 'PERMISSION_ERROR');
}

async function _checkUserIsUserOrMemberOfTeamAsync(userId, userOrTeamId, message) {
  // For now, let's let anyone update/edit things that don't have any owner
  if (!userOrTeamId) {
    return;
  }
  if (userId === userOrTeamId) {
    return;
  }
  if (await model.isMemberOfTeamAsync(userId, userOrTeamId)) {
    return;
  }
  throw PermissionError(message);
}

async function _checkUserIsUserOrAdminOfTeamAsync(userId, userOrTeamId, message) {
  // For now, let's let anyone update/edit things that don't have any owner
  if (!userOrTeamId) {
    return;
  }
  if (userId === userOrTeamId) {
    return;
  }
  if (await model.isAdminOfTeamAsync(userId, userOrTeamId)) {
    return;
  }
  throw PermissionError(message);
}

async function canAddToolAsync({ userId }) {
  // For now, let's let anyone make and update tools...
  return;

  // if (!(await model.isMemberOfTeamAsync(userId, 'user:expo'))) {
  //   throw PermissionError("You don't have permission to add tools");
  // }
}

async function canUpdateToolAsync({ userId }, toolId) {
  // For now, let's let anyone make and update tools...
  return;

  // if (!(await model.isMemberOfTeamAsync(userId, 'user:expo'))) {
  //   throw PermissionError("You don't have permission to update that tool");
  // }
}

async function canDeleteToolAsync({ userId }, toolId) {
  let tool = await model.getToolAsync(toolId);

  // You can delete this tool if you made the entry (at least for now)
  if (tool.creatorId === userId) {
    return;
  }

  // You can also delete the tool if you are a member of the expo team
  if (!(await model.isMemberOfTeamAsync(userId, 'user:expo'))) {
    throw PermissionError("You don't have permission to update that tool");
  }
}

async function loginRequiredAsync(context) {
  if (!context.userId) {
    throw ClientError('You need to be logged in to do that', 'LOGIN_REQUIRED');
  }
}

async function isLoggedInAsAsync({ userId }, userId2) {
  if (userId !== userId2) {
    throw PermissionError("You don't have permission to do that");
  }
}

async function canUpdateUserAsync({ userId }, updateUserId) {
  if (userId === updateUserId) {
    return;
  }
  if (await model.isAdminOfTeamAsync(userId, updateUserId)) {
    return;
  }
  throw PermissionError(
    `You (${userId}) don't have permission to update that user (${updateUserId})`
  );
}

let canDeleteUserAsync = canUpdateUserAsync;

async function canUpdateTeamAdminsAsync({ userId }, teamId) {
  if (userId === teamId) {
    return;
  }
  if (await model.isAdminOfTeamAsync(userId, teamId)) {
    return;
  }
  throw PermissionError('You must be an admin of a team to add or remove admins');
}

async function canAddMediaAsync(context, media) {
  let { userId } = context;
  if (!userId) {
    throw PermissionError('You must be logged in to add media');
  }
  if (media.userId) {
    await _checkUserIsUserOrMemberOfTeamAsync(
      userId,
      media.userId,
      "You don't have permission to add media as " + media.userId
    );
  }
  return;
}

async function canUpdateMediaAsync(context, mediaId) {
  return true; // For convenience for now

  let { userId } = context;

  // Don't use a loader here since we don't want to cache the media we're about to change
  let media = await model.getMediaAsync(mediaId);
  if (!media) {
    throw ClientError('No media with the id ' + mediaId + ' exists', 'NO_SUCH_MEDIA');
  }

  if (media.userId === userId) {
    return;
  }

  // If no one owns this media, then let's let anyone edit it, I guess?
  if (!media.userId) {
    return;
  }

  if (await model.isMemberOfTeamAsync(context.userId, media.userId)) {
    return;
  }

  if (await model.isMemberOfTeamAsync(context.userId, 'user:expo')) {
    return;
  }

  // TODO(ccheever): We may want to restrict whether you can
  // transfer ownership of media to someone else and how that
  // should happen, but we won't worry about it for now

  throw PermissionError("You don't have permission to update that media");
}

async function canAddPlaylistAsync(context) {
  let { userId } = context;
  if (userId) {
    return;
  }
  throw PermissionError('You have to be logged in to create playlists');
}

async function canUpdatePlaylistAsync(context, playlistId) {
  return true; // For convenience for now
  
  let { userId } = context;

  // Don't use a loader since we're gonna change stuff
  let playlist = await model.getPlaylistAsync(playlistId);
  await _checkUserIsUserOrMemberOfTeamAsync(
    userId,
    playlist.userId,
    "You don't have permission to update that playlist."
  );
}

async function canDeletePlaylistAsync(context, playlistId) {
  return await canUpdatePlaylistAsync(context, playlistId);
}

async function hasClientIdAsync(context) {
  let { clientId } = context;
  if (!clientId) {
    throw ClientError(
      'Your client must provide a client identifer via the' +
        ' `X-ClientId` HTTP header if you want to login or make ' +
        'other authorized requests. The clientId can be any ' +
        'arbitrary string you choose, but it should be unique enough ' +
        'that no other client would choose it.',
      'CLIENT_ID_REQUIRED'
    );
  } else {
    if (typeof clientId !== 'string') {
      throw ClientError(
        'The `clientId` that a client provides must be a string',
        'INVALID_CLIENT_ID'
      );
    }
    if (clientId.length === 0) {
      throw ClientError('Your `clientId` cannot be the empty string.');
    }
    if (clientId.length >= 1024) {
      throw ClientError('Your `clientId` must be < 1024 characters');
    }
  }
}

async function canSubscribeToUserAsync(context, { fromId, toId }) {
  let { userId } = context;
  if (!userId) {
    throw ClientError('You must be logged in to subscribe', 'LOGIN_REQUIRED');
  }
  await _checkUserIsUserOrMemberOfTeamAsync(
    userId,
    fromId,
    `You don't have permission to make ${fromId} subscribe to stuff`
  );
}

async function canUnsubscribeFromUserAsync(context, { fromId, toId }) {
  let { userId } = context;
  if (!userId) {
    throw ClientError('You must be logged in to unsubscribe', 'LOGIN_REQUIRED');
  }
  await _checkUserIsUserOrMemberOfTeamAsync(
    userId,
    fromId,
    `You don't have permission to make ${fromId} unsubscribe from stuff`
  );
}

async function canSeeContactInfoAsync(context, userId) {
  await _checkUserIsUserOrMemberOfTeamAsync(
    context.userId,
    userId,
    `You don't have permission to view the contact info for ${userId}`
  );
}

async function canUpdateContactInfoAsync(context, userId) {
  await _checkUserIsUserOrAdminOfTeamAsync(
    context.userId,
    userId,
    `You don't have permission to update the contact info for ${userId}`
  );
}

async function canConfirmContactInfoAsync(context, userId) {
  // For now, I think its fine to just not care who is logged in
  // when confirming an e-mail address
}

async function canRecordUserplayAsync(context, userplayId, userId) {
  if (userId) {
    if (context.userId !== userId) {
      throw PermissionError("Can't record a userplay for a different user");
    }
  }
}

async function canDownloadFilesAsync(context) {
  loginRequiredAsync(context);
}

module.exports = {
  _checkUserIsUserOrMemberOfTeamAsync,
  _checkUserIsUserOrAdminOfTeamAsync,
  canAddToolAsync,
  canUpdateToolAsync,
  canUpdateUserAsync,
  canDeleteUserAsync,
  canAddMediaAsync,
  canUpdateMediaAsync,
  canUpdateTeamAdminsAsync,
  canDeleteToolAsync,
  canAddPlaylistAsync,
  canUpdatePlaylistAsync,
  canDeletePlaylistAsync,
  hasClientIdAsync,
  isLoggedInAsAsync,
  loginRequiredAsync,
  canSubscribeToUserAsync,
  canUnsubscribeFromUserAsync,
  canSeeContactInfoAsync,
  canUpdateContactInfoAsync,
  canConfirmContactInfoAsync,
  canRecordUserplayAsync,
  canDownloadFilesAsync,
};
