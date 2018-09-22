let isPromise = require('is-promise');
let time = require('@expo/time');

module.exports = (apiImplementationClass, opts) => {
  opts = {
    timing: true,
    serverContext: null,
    ...opts,
  };

  return async (req, res) => {
    let tk;
    if (opts.timing) {
      tk = time.start();
    }

    let r = {
      data: null,
      error: null,
      clientError: null,
      warnings: null,
      result: null,
      commands: null,
    };

    let { method, args, context } = req.body;
    let api = new apiImplementationClass();
    if (opts.serverContext) {
      let cr = await opts.serverContext(context, { req, res });
      if (isPromise(cr)) {
        cr = await cr;
      }
      if (cr) {
        api.serverContext = cr;
      }
    }
    api.serverContext = api.serverContext || {};
    api.context = context;
    api.responseAddWarning = (code, message) => {
      r.warnings = r.warnings || [];
      r.warnings.push([code, message]);
    };

    api.responseAddData = (key, value) => {
      r.data = r.data || {};
      r.data[key] = value;
    };

    api.responseAddCommand = (command) => {
      r.commands = r.commands || [];
      r.commands.push(command);
    };

    let m = api[method + 'Async'];
    if (method.startsWith('__')) {
      r.error = {
        message: "Methods can't start with double underscore ('__')",
        type: 'API_ERROR',
        code: 'INVALID_METHOD_NAME',
      };
    } else if (!m) {
      let err = {
        message: 'No such method: `' + method + '`',
        type: 'API_ERROR',
        code: 'NO_SUCH_METHOD',
      };
      r.error = err;
    } else {
      try {
        r.result = await api[method + 'Async'](...args);
      } catch (e) {
        console.error('Internal Server Error', e);
        let err = {
          ...e,
          message: e.message,
          type: e.type,
          code: e.code,
        };
        if (e.isClientError) {
          r.clientError = err;
        } else {
          r.error = {
            message: 'API Server Error',
            type: e.type || 'API_SERVER_ERROR',
            code: e.code || 'UNKNOWN',
          };
        }
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(r);

    if (opts.timing) {
      let logArgs = api._logArgs || args;
      time.end(tk, 'api', {
        threshold: 0,
        message: method + JSON.stringify(logArgs),
      });
    }
  };
};
