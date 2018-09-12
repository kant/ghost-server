let express = require('express');
let bodyParser = require('body-parser');

let handler = require('./handler');

class ExampleApi {
  addAsync(...args) {
    let sum = 0;
    for (let x of args) {
      sum += x;
    }
    return sum;
  }

  warnAsync(...args) {
    for (let message of args) {
      this.responseAddWarning('TEST_WARNING', 'Echoing back: ' + message);
    }
    return args.length;
  }

  sendDataAsync(...args) {
    let n = 0;
    for (let i = 0; i < args.length; i += 2) {
      let key = args[i];
      let value = args[i + 1];
      this.responseAddData(key, value);
      n++;
    }
    return n;
  }

  noopAsync() {}

  sendCommandsAsync(...args) {
    for (let command of args) {
      this.responseAddCommand(command);
    }
  }

  reverseAsync(s) {
    return s
      .split('')
      .reverse()
      .join('');
  }
}

async function mainAsync() {
  let app = express();
  let port = process.env.PORT || 8080;
  app.use(bodyParser.json());

  app.post('/', handler(ExampleApi));

  app.listen(port, () => {
    console.log('Listening on port ' + port);
  });
}

module.exports = mainAsync;
Object.assign(module.exports, {
  ExampleApi,
  mainAsync,
});

if (require.main === module) {
  mainAsync();
}
