let db = require('./db');

async function writeGhostSignupAsync(resultData) {
  let userId = resultData.data.user.id;
  let signupEmail = resultData.data.user.email;
  let signupTime = resultData.data.user.created_at;
  let signupUsername = resultData.data.user.username;
  await db.queryAsync(
    `
    INSERT INTO "ghostSignups" ( 
      "signupTime","
      "userId",
      "signupUsername",
      "signupEmail"
    ) VALUES ($1, $2, $3, $4)`,
    [signupTime, userId, signupUsername, signupEmail]
  );
}

module.exports = {
  writeGhostSignupAsync,
};
