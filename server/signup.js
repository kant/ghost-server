let data = require('./data');
let model = require('./model');
let passwordlib = require('./passwordlib');
let validation = require('./validation');

async function signupAsync(userInput, password) {

  let username = await validation.validateUsernameAsync(userInput.username);
  await validation.validatePasswordAsync(password);

  let user_ = { ...userInput };
  user_.username = username;
  let createdUser = await model.signupAsync(user_, password);

  await passwordlib.setUserPasswordAsync(createdUser.userId, password);

  return createdUser;
}

module.exports = {
  signupAsync,
};
