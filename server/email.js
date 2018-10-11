let sendgridMail = require('@sendgrid/mail');

let secret = require('./secret');

sendgridMail.setApiKey(secret.sendgrid.apiKey);

async function sendEmailAsync(msg) {
  return await sendgridMail.send(msg);
}

module.exports = {
  sendEmailAsync,
};
