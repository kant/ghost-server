let sendgridMail = require('@sendgrid/mail');

let loaders = require('./loaders');
let secret = require('./secret');

sendgridMail.setApiKey(secret.sendgrid.apiKey);

async function sendEmailAsync(msg) {
  // let exampleMessage = {
  //   to: 'test@example.com',
  //   from: 'test@example.com',
  //   subject: 'Sending with SendGrid is Fun',
  //   text: 'and easy to do anywhere, even with Node.js',
  //   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  // };

  return await sendgridMail.send(msg);
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

async function addNewEmailAddressAsync(userId, email, opts) {
  return null;
}


module.exports = {
  sendEmailAsync,
  sendUserEmailAsync,
  addNewEmailAddressAsync,
};
