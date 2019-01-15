let passwordHashAndSalt = require('password-hash-and-salt');

async function hashPasswordAsync(password) {
  return await new Promise((resolve, reject) => {
    passwordHashAndSalt(password).hash((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function checkPasswordAsync(password, hash) {
  return await new Promise((resolve) => {
    passwordHashAndSalt(password).verifyAgainst(hash, (err, result) => {
      if (err) {
        resolve(false);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  hashPasswordAsync,
  checkPasswordAsync,
};
