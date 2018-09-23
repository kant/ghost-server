let ClientError = require('./ClientError');
let data = require('./data');
let db = require('./db');
let model = require('./model');

function PermissionError(message) {
  return ClientError(message, 'PERMISSION_ERROR');
}

async function canAddEngineAsync({ userId }) {
  if (!(await model.isMemberOfTeamAsync(userId, 'user:expo'))) {
    throw PermissionError("You don't have permission to add engines");
  }
}

async function canUpdateEngineAsync({ userId }, engineId) {
  if (!(await model.isMemberOfTeamAsync(userId, 'user:expo'))) {
    throw PermissionError("You don't have permission to update that engine");
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

async function canAddMediaAsync({ userId }) {
  return;
}

async function canUpdateMediaAsync(context, mediaId) {
  let { userId } = context;
  let media = await context.loaders.media.load(mediaId);
  if (media.userId === userId) {
    return;
  }

  // If no one owns this media, then let's let anyone edit it, I guess?
  if (!media.userId) {
    return;
  }

  let team = await context.loaders.user.load(media.userId);
  if (team && team.roles && team.roles.members) {
    if (team.roles.members.includes(userId)) {
      return;
    }
  }

  throw PermissionError("You don't have permission to update that media");
}

module.exports = {
  canAddEngineAsync,
  canUpdateEngineAsync,
  canUpdateUserAsync,
  isLoggedInAsAsync,
  canAddMediaAsync,
  canUpdateMediaAsync,
};
