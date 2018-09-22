let model = require('./model');
let passwordlib = require('./passwordlib');
let ClientError = require('./ClientError');

async function loginAsync(clientId, usernameOrSimilar, password, opts) {
  opts = opts || {};
  let user = await model.getUserForLoginAsync(usernameOrSimilar);
  if (!user) {
    throw ClientError('No such user', 'USER_NOT_FOUND');
  }
  if (await passwordlib.checkUserPasswordAsync(user.userId, password)) {
    await model.startSessionAsync({
      clientId,
      userId: user.userId,
      createdIp: opts.createdIp,
    });
    return user;
  } else {
    throw ClientError('Incorrect password', 'INCORRECT_PASSWORD');
  }
}

async function logoutAsync(clientId) {
  return await model.endSessionAsync(clientId);
}

module.exports = {
  loginAsync,
  logoutAsync,
}
