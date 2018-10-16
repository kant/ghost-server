let phone = require('phone');
let twilite = require('twilite');

let ClientError = require('./ClientError');
let db = require('./db');
let loaders = require('./loaders');
let secret = require('./secret');

let tw = twilite(secret.twilio);

async function sendMessageAsync(...args) {
  return await tw.sendMessageAsync(...args);
}

async function sendUserMessageAsync(userId, message) {
  let phoneNumbers = (await loaders.loadPhoneAsync([userId]))[0];
  let number;
  if (phoneNumbers && phoneNumbers[0]) {
    number = phoneNumbers[0].number;
  } else {
    return false;
  }
  if (typeof message === 'string') {
    message = { Body: message };
  }
  let msgToSend = { ...message, To: number };
  return await sendMessageAsync(msgToSend);
}

function normalize(n) {
  let p = phone(n);
  if (!p.length) {
    throw ClientError(
      `Don't know how to interpret the phone number ${n} ; you might need to include a country code.`
    );
  }
  return p[0];
}

async function addNewPhoneNumberAsync(userId, number, opts) {
  opts = opts || {};
  let { makePrimary } = opts;
  let code = makeConfirmationCode();
  let [nNumber, country] = phone(number);
  let numberInfo = {
    userId,
    rawNumber: number,
    number: nNumber,
    country,
    isPrimary: !!opts.makePrimary,
    confirmed: false,
    confirmationCode: code,
  };
  await _writeNewNumberAsync(numberInfo);
  await _sendConfirmationSmsAsync(numberInfo);
  if (opts.makePrimary) {
    await setPrimaryPhoneNumberAsync(userId, number);
  }
  return numberInfo;
}

async function _writeNewNumberAsync(numberInfo) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  INSERT INTO "phone" (
    "userId",
    "number",
    "country",
    "isPrimary",
    "confirmationCode",
    "codeSentTime",
    "incorrectConfirmations",
    "confirmed",
    "bouncing",
    "rawNumber"
  ) VALUES (
    ${r(numberInfo.userId)},
    ${r(numberInfo.number)},
    ${r(numberInfo.country)},
    ${r(numberInfo.isPrimary)},
    ${r(numberInfo.confirmationCode)},
    now(),
    0,
    False,
    False,
    ${r(numberInfo.rawNumber)}
  ) ON CONFLICT ON CONSTRAINT phone_pkey DO UPDATE SET
    "confirmationCode" = ${r(numberInfo.confirmationCode)},
    "codeSentTime" = now(),
    "rawNumber" = ${r(numberInfo.rawNumber)},
    "country" = ${r(numberInfo.country)}
    ;
  `,
    r.values()
  );
  return result.rowCount;
}

function formatCode(code) {
  let pivot = Math.floor(code.length / 2);
  return code.substr(0, pivot) + ' ' + code.substr(pivot);
}

async function _sendConfirmationSmsAsync(numberInfo) {
  await sendMessageAsync({
    To: numberInfo.number,
    Body: `Castle confirmation code: ${formatCode(numberInfo.confirmationCode)}`,
  });
}

function stripNonDigits(s) {
  return s.replace(/[^0-9]+/g, '');
}

async function confirmPhoneNumberAsync(userId, number, code) {
  let r = db.replacer();
  let result = await db.queryAsync(
    /* SQL */ `
  SELECT "userId", "number", "confirmed", "confirmationCode" FROM "phone"
  WHERE "userId" = ${r(userId)} AND "number" = ${r(number)}
  ;
  `,
    r.values()
  );
  if (!result.rowCount) {
    return false;
  }
  let numberInfo = result.rows[0];
  if (numberInfo.confirmed) {
    // Already confirmed
    return true;
  }
  if (numberInfo.confirmationCode === stripNonDigits(code)) {
    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */ `
    UPDATE "phone" SET "confirmed" = True, "confirmedTime" = now(), "commandeered" = False
    WHERE "number" = ${r(number)} AND "userId" = ${r(userId)}
    ;
    `,
      r.values()
    );

    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */ `
    UPDATE "phone" SET "commandeered" = True, "commandeeredBy" = ${r(
      userId
    )}, "commandeeredTime" = now()
    WHERE "number" = ${r(number)} AND "userId" <> ${r(userId)}
    ;
    `,
      r.values()
    );
    return true;
  } else {
    r = db.replacer();
    result = await db.queryAsync(
      /* SQL */ `
    UPDATE "phone" SET "incorrectConfirmations" = ("incorrectConfirmations" + 1)
    WHERE "userId" = ${r(userId)} AND "number" = ${r(number)}
    ;
    `,
      r.values()
    );
    return false;
  }
}

function makeConfirmationCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += '' + Math.floor(Math.random() * 10);
  }
  return code;
}

async function setPrimaryPhoneNumberAsync(userId, number) {
  let r = db.replacer();
  await db.queryAsync(
    /* SQL */ `
    UPDATE "phone" SET "isPrimary" = ("number" = ${r(number)}) 
    WHERE "userId" = ${r(userId)}
    ;
    `,
    r.values()
  );
}

module.exports = {
  sendMessageAsync,
  sendUserMessageAsync,
  addNewPhoneNumberAsync,
  makeConfirmationCode,
  normalize,
  confirmPhoneNumberAsync,
  setPrimaryPhoneNumberAsync,
};
