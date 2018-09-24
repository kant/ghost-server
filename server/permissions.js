let ClientError = require('./ClientError');
let model = require('./model');

function PermissionError(message) {
  return ClientError(message, 'PERMISSION_ERROR');
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
  canAddToolAsync,
  canUpdateToolAsync,
  canUpdateUserAsync,
  isLoggedInAsAsync,
  canAddMediaAsync,
  canUpdateMediaAsync,
  canUpdateTeamAdminsAsync,
};
