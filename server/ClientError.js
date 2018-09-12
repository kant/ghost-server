module.exports = (message, code) => {
  let err = new Error(message);
  err.type = 'CLIENT_ERROR';
  err.code = code;
  return err;
}