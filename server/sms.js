let twilite = require('twilite');

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

module.exports = {
  sendMessageAsync,
  sendUserMessageAsync,
};
