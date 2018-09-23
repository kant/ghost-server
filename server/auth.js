let model = require('./model');
let passwordlib = require('./passwordlib');
let ClientError = require('./ClientError');

async function getUserForLoginAsync(identifier) {
  // username is first priority
  let user;
  user = await model.getUserByUsernameAsync(identifier);
  if (user) {
    return user;
  }

  // userId next
  user = await model.getUserAsync(identifier);
  if (user) {
    return user;
  }

  // TODO: phone, e-mail
  return null;
}

async function loginAsync(clientId, usernameOrSimilar, password, opts) {
  opts = opts || {};
  let user = await getUserForLoginAsync(usernameOrSimilar);
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
  getUserForLoginAsync,
  loginAsync,
  logoutAsync,
};
