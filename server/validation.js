let ClientError = require('./ClientError');

function InvalidUsernameError(message) {
  return ClientError(message, 'INVALID_USERNAME');
}
async function validateUsernameAsync(username) {
  // Let's just use the rules for subdomains
  // a-z and 0-9 and - allowed
  // Can't start with a - or end with a -
  // Max of 63 characters
  //

  if (typeof username !== 'string') {
    throw InvalidUsernameError('Username must be a string');
  }

  if (username.length < 1) {
    throw InvalidUsernameError('Username must be at least 1 character');
  }

  if (username.length > 63) {
    throw InvalidUsernameError('Username must but 63 characters or fewer');
  }

  let rv = /^[a-z0-9\-]+$/;
  if (!rv.test(username)) {
    throw InvalidUsernameError('Invalid character for username. a-z 0-9 and dash (`-`) are valid');
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    throw InvalidUsernameError("Usernames can't start or end with a dash (`-`)");
  }

  return username;
}

function InvalidTagError(message) {
  return ClientError(message, 'INVALID_TAG');
}

async function validateTagAsync(tag) {
  if (typeof tag !== 'string') {
    throw InvalidTagError('Tags must be strings');
  }
  if (tag !== tag.toLowerCase()) {
    throw InvalidTagError('Tags must be all lowercase');
  }

  let rv = /^[a-z0-9\-]+$/;
  if (!rv.test(tag)) {
    throw InvalidTagError('Invalid character for tag. a-z 0-9 and dash (`-`) are valid');
  }

  if (tag.startsWith('-' || tag.endsWith('-'))) {
    throw InvalidTagError("Tags can't start or end with -");
  }
}

module.exports = {
  validateUsernameAsync,
  validateTagAsync,
};
