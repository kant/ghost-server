let ClientError = require('./ClientError');

async function validateUsernameAsync(username) {

  // Let's just use the rules for subdomains
  // a-z and 0-9 and - allowed
  // Can't start with a - or end with a -
  // Max of 63 characters
  // 

  if (typeof(username) !== 'string') {
    throw ClientError("Username must be a string", 'INVALID_USERNAME');
  }

  if (username.length < 1) {
    throw ClientError("Username must be at least 1 character", 'INVALID_USERNAME');
  }

  if (username.length > 63) {
    throw ClientError("Username must but 63 characters or fewer", "INVALID_USERNAME");
  }

  let rv = /^[a-z0-9\-]+$/;
  if (!rv.test(username)) {
    throw ClientError("Invalid character for username. a-z 0-9 and dash (`-`) are valid", 'INVALID_USERNAME');
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    throw ClientError("Usernames can't start or end with a dash (`-`)", 'INVALID_USERNAME');
  }

  return username;

}

module.exports = {
  validateUsernameAsync,
}