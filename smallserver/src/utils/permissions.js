let ClientError = require('../common/ClientError');

function PermissionError(message) {
  return ClientError(message, 'PERMISSION_ERROR');
}

async function loginRequiredAsync(context) {
  if (!context.userId) {
    throw ClientError('You need to be logged in to do that', 'LOGIN_REQUIRED');
  }
}

module.exports = { loginRequiredAsync };
