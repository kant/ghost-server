let fetch = require('cross-fetch');

let API_URL = 'https://api.sendgrid.com/v3/mail/send';

class Sgmlite {
  constructor(apiKey, opts) {
    this.apiKey = apiKey;
    this.apiUrl = API_URL;
    Object.assign(this, opts);
  }

  _emailToPersonalizationList(x) {
    if (Array.isArray(x)) {
      return x.map((y) => {
        return this._emailToPersonalization(y);
      });
    } else if (typeof x === 'object' || typeof x === 'string') {
      return [this._emailToPersonalization(x)];
    } else {
      throw new Error("Don't know how to handle an e-mail of type " + typeof x);
    }
  }

  _emailToPersonalization(x) {
    switch (typeof x) {
      case 'string':
        return { email: x };
      case 'object':
        return x;
      default:
        throw new Error("Don't know how to handle an e-mail of type " + typeof x);
    }
  }

  async sendEmailAsync(msg) {
    let p = [];
    for (let field of ['to', 'cc', 'bcc']) {
      if (msg[field]) {
        p.push({ [field]: this._emailToPersonalizationList(msg[field]) });
      }
    }

    let content = [];
    if (msg.text) {
      content.push({
        value: msg.text,
        type: 'text/plain',
      });
    }

    if (msg.html) {
      content.push({
        value: msg.html,
        type: 'text/html',
      });
    }

    let body = {
      personalizations: p,
      subject: msg.subject,
      content,
    };

    let from = this.from || msg.from;
    if (typeof from === 'string') {
      from = { email: from };
    }
    body.from = from;

    if (msg.headers) {
      body.headers = msg.headers;
    }

    Object.assign(body, msg.body);

    let response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await response.text();
  }
}

module.exports = (...args) => new Sgmlite(...args);

Object.assign(module.exports, {
  Sgmlite,
});
