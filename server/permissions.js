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
  throw PermissionError("You don't have permission to update that user");
}

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
  let { userId } = context;

  // Don't use a loader here since we don't want to cache the media we're about to change
  let media = await model.getMediaAsync(mediaId);
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

module.exports = {
  _checkUserIsUserOrMemberOfTeamAsync,
  canAddToolAsync,
  canUpdateToolAsync,
  canUpdateUserAsync,
  isLoggedInAsAsync,
  canAddMediaAsync,
  canUpdateMediaAsync,
  canUpdateTeamAdminsAsync,
  canDeleteToolAsync,
  canAddPlaylistAsync,
  canUpdatePlaylistAsync,
  canDeletePlaylistAsync,
};
