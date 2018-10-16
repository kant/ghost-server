let sgmlite = require('sgmlite');

let data = require('./data');
let db = require('./db');
let loaders = require('./loaders');
let secret = require('./secret');

let sg = sgmlite(secret.sendgrid.apiKey);

async function sendEmailAsync(msg) {
  // let exampleMessage = {
  //   to: 'test@example.com',
  //   from: 'test@example.com',
  //   subject: 'Sending with SendGrid is Fun',
  //   text: 'and easy to do anywhere, even with Node.js',
  //   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  // };

  return await sg.sendEmailAsync(msg);
}

async function sendUserEmailAsync(userId, msg) {
  let emails = (await loaders.loadEmailAsync([userId]))[0];
  let email;
  if (emails) {
    email = emails[0].email;
  } else {
    // Should we throw an error or just return false if there's no
    // way to email the user
    return false;
  }
  let msgToSend = { from: 'castle@expo.io', ...msg, to: email };
  return await sendEmailAsync(msgToSend);
}

function makeConfirmationCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += '' + Math.floor(Math.random() * 10);
  }
  return code;
}

async function addNewEmailAddressAsync(userId, email, opts) {
  opts = opts || {};
  let code = makeConfirmationCode();
  let emailData = {
    userId,
    rawEmail: email,
    email: normalize(email),
    isPrimary: !!opts.makePrimary,
    confirmed: false,
    confirmationCode: code,
  };
  await _writeNewEmailAsync(emailData);
  await _sendConfirmationEmail(emailData);
  if (opts.makePrimary) {
    await setPrimaryEmailAsync(userId, email);
  }
  return emailData;
}

async function setPrimaryEmailAsync(userId, email) {
  let r = db.replacer();
  await db.queryAsync(
    /* SQL */ `
  UPDATE "email" SET "isPrimary" = ("email" = ${r(email)}) WHERE "userId" = ${r(userId)};
  `,
    r.values()
  );
}

async function _writeNewEmailAsync(obj) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  INSERT INTO "email" (
    "userId",
    "email",
    "isPrimary",
    "confirmationCode",
    "codeSentTime",
    "incorrectConfirmations",
    "confirmed",
    "bouncing",
    "rawEmail"
  ) VALUES (
    ${r(obj.userId)},
    ${r(obj.email)},
    ${r(obj.isPrimary)},
    ${r(obj.confirmationCode)},
    now(),
    0,
    False,
    False,
    ${r(obj.rawEmail)}
  ) ON CONFLICT ON CONSTRAINT email_pkey DO UPDATE SET
  "confirmationCode" = ${r(obj.confirmationCode)},
  "codeSentTime" = now(),
  "rawEmail" = ${r(obj.rawEmail)}
  `,
    r.values()
  );
  return result.rowCount;
}

async function _sendConfirmationEmail(emailData) {
  let people = ['@jim', '@ben', '@jesse', '@schazers', '@nikki', '@ccheever'];
  let shuffle = (a) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };
  shuffle(people);

  await sendEmailAsync({
    to: emailData.email,
    from: 'castle@expo.io',
    subject: 'Thanks for signup up for Castle! Please confirm your e-mail',
    text: `
Thanks for signing up for Castle!

Your code to confirm this e-mail address (${emailData.email}) is ${emailData.confirmationCode}

We're trying to build Castle to be a healthy place to instantly play and create games and experience digital art with other people.

We hope you find some cool stuff that inspires you and have some fun.

Send us feedback any time at feedback@playcastle.io

    -- ${people.join(', ')}

    `,
  });
}

function stripNonDigits(s) {
  return s.replace(/[^0-9]+/g, '');
}

async function confirmEmailAsync(userId, email, code) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  SELECT "userId", "email", "confirmed", "confirmationCode" FROM "email" WHERE "userId" = ${r(
    userId
  )} AND "email" = ${r(email)};
  `,
    r.values()
  );
  if (!result.rowCount) {
    return false;
  }
  let emailInfo = result.rows[0];
  if (emailInfo.confirmed) {
    // Already confirmed
    return true;
  }
  if (emailInfo.confirmationCode === stripNonDigits(code)) {
    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */ `
    UPDATE "email" SET "confirmed" = True, "confirmedTime" = now(), "commandeered" = False WHERE "email" = ${r(
      email
    )} AND "userId" = ${r(userId)};
    `,
      r.values()
    );

    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */ `
    UPDATE "email" SET "commandeered" = True, "commandeeredBy" = ${r(
      userId
    )}, "commandeeredTime" = NOW() WHERE "email" = ${r(email)} AND "userId" <> ${r(userId)};
    `,
      r.values()
    );
    return true;
  } else {
    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */
      `UPDATE "email" SET "incorrectConfirmations" = ("incorrectConfirmations" + 1) WHERE 
      "userId" = ${r(userId)} AND "email" = ${r(email)};`,
      r.values()
    );
    return false;
  }
}

function normalize(email) {
  // We don't normalize + suffixes or dots because we are fine with
  // people creating multiple accounts under the same e-mail address.
  // What we want to avoid is people getting confused because they
  // entered their email address one way (CCHEEVER@expo.io) and then
  // when they enter it again a different away (ccheever@expo.io), it
  // doesn't match exactly
  return email.toLowerCase();
}

async function removeEmailAddressAsync(userId, email) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  DELETE FROM "email" 
  WHERE "userId" = ${r(userId)} AND "email" = ${r(email)}
  ;
  `,
    r.values()
  );
  return result.rowCount;
}

module.exports = {
  sendEmailAsync,
  sendUserEmailAsync,
  addNewEmailAddressAsync,
  normalize,
  makeConfirmationCode,
  setPrimaryEmailAsync,
  confirmEmailAsync,
  removeEmailAddressAsync,
};
