let querystring = require('querystring');
let fetch = require('node-fetch');

let package = require('../package');

let HOST = 'https://exp.host';

class ExpoApiV2HttpClient {
  async getAsync(methodName, args) {
    return this._requestAsync(methodName, {
      httpMethod: 'get',
      queryParameters: args,
    });
  }

  async postAsync(methodName, args) {
    return this._requestAsync(methodName, {
      httpMethod: 'post',
      body: args,
    });
  }

  async _requestAsync(methodName, options) {
    let url = HOST + '/--/api/v2/' + encodeURI(methodName);
    if (options.queryParameters) {
      url += '?' + querystring.stringify(options.queryParameters);
    }

    let fetchOptions = {
      method: options.httpMethod,
      headers: {
        'Exponent-Platform': 'Ghost',
      },
    };

    if (options.body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, fetchOptions);
    let resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      let err = new Error("THere was a problem understanding the server's response.");
      err.responseBody = resultText;
      throw err;
    }

    if (!result || typeof result !== 'object') {
      let err = new Error("THere was a problem understanding the server's response.");
      err.responseBody = resultText;
      throw err;
    }

    if (result.errors && result.errors.length) {
      let responseError = result.errors[0];
      let error = new Error(responseError.message);
      error.ApiV2Error = true;
      error.code = responseError.code;
      error.serverStack = responseError.stack;
      throw error;
    }

    return result.data;
  }
}

module.exports = ExpoApiV2HttpClient;
