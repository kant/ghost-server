let validation = require('./validation');
let model = require('./model');

async function signupAsync(user) {
  let username = await validation.validateUsernameAsync(user.username);
  let user_ = { ...user };
  for (let jsonField of ['about', 'photo']) {
    if (user_.hasOwnProperty(jsonField)) {
      user_[jsonField] = JSON.stringify(user_[jsonField]);
    }
  }
  return await model.signupAsync(user_);
}

module.exports = {
  signupAsync,
};
