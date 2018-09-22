let fetch = require('cross-fetch');

let pkg = require('./package');

let version = pkg.version;

class ThinClient {
  clientAgentString() {
    let name = this.constructor.name || 'ThinClient';
    return name + ';' + pkg.name + '/' + version;
  }

  clientAddSimpleMethods(...args) {
    for (let method of args) {
      this[method + 'Async'] = async (...args) => {
        return await this.callAsync(method, ...args);
      };
    }
  }

  constructor(url, context, opts) {
    this.url = url || 'http://localhost:8080/';
    this.context = context || {
      agent: this.clientAgentString(),
    };
    this.opts = Object.assign({}, opts);

    // Install simple methods
    this.clientAddSimpleMethods(...this.clientSimpleMethods());
  }

  clientSimpleMethods() {}

  clientDidReceiveData(data) {}

  clientDidReceiveCommand(command) {}

  clientDidReceiveWarning(code, message) {
    console.warn('API Response Warning: ' + code + ': ' + message);
  }

  async callAsync(method, ...args) {
    if (method.startsWith('client') || method.startsWith('_')) {
      throw new Error('Method name not allowed: ' + method);
    }

    let response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        context: this.context,
        method,
        args,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let r;
    let responseText;
    try {
      responseText = await response.text();
      r = JSON.parse(responseText);
    } catch (e) {
      console.error(responseText);
      let err = new Error("Didn't understand response from server");
      err.ServerError = true;
      err.responseText = responseText;
      throw err;
    }

    if (r.error) {
      let err = new Error(r.error.message);
      Object.assign(err, r.error);
      err.ApiError = true;
      throw err;
    }

    if (r.clientError) {
      let err = new Error(r.clientError.message);
      Object.assign(err, r.clientError);
      err.ClientError = true;
      throw err;
    }

    if (r.data) {
      this.clientDidReceiveData(r.data);
    }

    // Handle commands
    if (r.commands) {
      for (let command of r.commands) {
        this.clientDidReceiveCommand(command);
      }
    }

    if (r.warnings) {
      for (let [code, message] of r.warnings) {
        this.clientDidReceiveWarning(code, message);
      }
    }

    return r.result;
  }
}

module.exports = ThinClient;
