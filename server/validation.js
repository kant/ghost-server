let ClientError = require('./ClientError');

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
  return await _validateSubdomainString(slug, 'slug');
}

module.exports = {
  validateUsernameAsync,
  validateSlugAsync,
  validateTagAsync,
  validatePasswordAsync,
  validateTagListAsync,
};
