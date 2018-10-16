let ClientError = require('./ClientError');
let emaillib = require('./emaillib');
let model = require('./model');
let passwordlib = require('./passwordlib');
let sms = require('./sms');
let validation = require('./validation');

async function getUserForLoginAsync(identifierObject) {
  let { username, who, userId } = identifierObject;

  if (userId) {
    return await model.getUserAsync(userId);
  }

  if (username) {
    return await model.getUserByUsernameAsync(username);
  }

  if (who) {
    let user, userId;

    // E-mail
    let nEmail = emaillib.normalize(who);
    userId = await model.getUserIdForEmailAsync(nEmail);
    if (userId) {
      user = await model.getUserAsync(userId);
      if (user) {
        return user;
      }
    }

    // Phone number
    let nNumber;
    try {
      nNumber = sms.normalize(who);
    } catch (e) {
      // pass
    }
    if (nNumber) {
      userId = await model.getUserIdForPhoneNumberAsync(nNumber);
      if (userId) {
        user = await model.getUserAsync(userId);
        if (user) {
          return user;
        }
      }
    }

    // username is first priority
    user = await model.getUserByUsernameAsync(who);
    if (user) {
      return user;
    }

    // userId next
    user = await model.getUserAsync(who);
    if (user) {
      return user;
    }
  }

  return null;
}

async function loginAsync(clientId, identifierObject, password, opts) {
  opts = opts || {};

  let user = await getUserForLoginAsync(identifierObject);
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

async function changePasswordAsync(userId, oldPassword, newPassword) {
  if (!userId) {
    throw ClientError('You need to be logged in to change your password', 'PERMISSION_ERROR');
  }

  if (!(await passwordlib.checkUserPasswordAsync(userId, oldPassword))) {
    throw ClientError('Incorrect password', 'INCORRECT_PASSWORD');
  }

  await validation.validatePasswordAsync(newPassword);

  await passwordlib.setUserPasswordAsync(userId, newPassword);

  return true;
}

async function logoutAsync(clientId) {
  return await model.endSessionAsync(clientId);
}

async function logoutEverywhereAsync(userId) {
  return await model.endAllSessionsForUserAsync(userId);
}

async function logoutEverywhereElseAsync(userId, clientId) {
  return await model.endAllSessionsForUserExceptAsync(userId, clientId);
}

module.exports = {
  getUserForLoginAsync,
  loginAsync,
  logoutAsync,
  logoutEverywhereAsync,
  logoutEverywhereElseAsync,
  changePasswordAsync,
};
