let isemail = require('isemail');

let ClientError = require('./ClientError');
let db = require('./db');

async function _validateSubdomainString(str, type) {
  // Let's just use the rules for subdomains
  // a-z and 0-9 and - allowed
  // Can't start with a - or end with a -
  // Max of 63 characters
  //

  let firstCap = type.charAt(0).toUpperCase() + type.substr(1).toLowerCase();
  let errorCode = 'INVALID_' + type.toUpperCase();

  if (typeof str !== 'string') {
    throw ClientError(firstCap + ' must be a string', errorCode);
  }

  if (str.length < 1) {
    throw ClientError(firstCap + ' must be at least 1 character', errorCode);
  }

  if (str.length > 63) {
    throw ClientError(firstCap + ' must but 63 characters or fewer', errorCode);
  }

  let rv = /^[a-z0-9\-]+$/;
  if (!rv.test(str)) {
    throw ClientError(
      'Invalid character for ' + type.toLowerCase() + '. a-z 0-9 and dash (`-`) are valid',
      errorCode
    );
  }

  if (str.startsWith('-') || str.endsWith('-')) {
    throw ClientError(firstCap + "s can't start or end with a dash (`-`)", errorCode);
  }

  return str;
}

async function validateUsernameAsync(username) {
  return await _validateSubdomainString(username, 'username');
}

async function validateTagAsync(tag) {
  return await _validateSubdomainString(tag, 'tag');
}

async function validateTagListAsync(tagList) {
  for (let tag of tagList) {
    await validateTagAsync(tag);
  }
}

function InvalidPasswordError(message) {
  return ClientError(message, 'INVALID_PASSWORD');
}

async function validatePasswordAsync(password) {
  if (typeof password === 'string' && password.length > 0 && password.length < 256) {
    return;
  }
  throw InvalidPasswordError('Passwords must be strings between 1 and 255 characters long');
}

async function validateSlugAsync(slug) {
  return _validateSubdomainString(slug, 'slug');
}

async function validateEmailAsync(email) {
  return isemail.validate(email);
}

async function _captureErrorAsync(validationFunctionAsync, args) {
  try {
    await validationFunctionAsync(...args);
    return null;
  } catch (e) {
    return {message: e.message};
  }
}

async function validateNameAsync(name) {
  if (typeof name === 'string' && name.length > 0) {
    return null;
  }
  throw ClientError('Names must be at least one character long', 'INVALID_NAME');
}

async function isUsernameTakenAsync(username) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `SELECT "userId" FROM "user" WHERE "username" = ${r(username)};`,
    r.values()
  );
  return result.rowCount > 0;
}

async function validateSignupAsync({ context, inputs }) {
  let { username, name, email, password } = inputs;

  let isUsernameTaken = await isUsernameTakenAsync(inputs.username);
  let usernameError = isUsernameTaken ? {message: 'That username is already taken'} : null;
  if (!usernameError) {
    usernameError = await _captureErrorAsync(validateUsernameAsync, [username]);
  }

  return {
    username: usernameError,
    name: await _captureErrorAsync(validateNameAsync, [name]),
    password: await _captureErrorAsync(validatePasswordAsync, [password]),
    email: await _captureErrorAsync(validateEmailAsync, [email]),
  };
}

module.exports = {
  validateUsernameAsync,
  validateSlugAsync,
  validateTagAsync,
  validatePasswordAsync,
  validateTagListAsync,
  validateSignupAsync,
};
