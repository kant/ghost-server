let ThinClient = require('./ThinClient');

class ExampleClient extends ThinClient {
  constructor(url, context, opts) {
    super(url, context, opts);
    this.clientAddSimpleMethods('warn', 'add');
  }

  clientSimpleMethods() {
    return ['sendData', 'sendCommands', 'noop'];
  }

  clientDidReceiveCommand(command) {
    console.log('Received command: ' + JSON.stringify(command));
  }

  clientDidReceiveData(data) {
    console.log('Received data: ' + JSON.stringify(data));
  }

  async reverseAsync(s) {
    let result = await this.callAsync('reverse', s);
    console.log(result);
    return result;
  }
}

module.exports = new ExampleClient();
