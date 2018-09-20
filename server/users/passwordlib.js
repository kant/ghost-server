let bcrypt = require('bcrypt');

let saltRounds = 10;

async function hashPasswordAsync(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

async function checkPasswordAsync(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(err);
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
