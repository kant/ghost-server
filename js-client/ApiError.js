function ApiError(message, code) {
  let err = new Error(message);
  err.isApiError = true;
  err.code = code;
  return err;
}

module.exports = ApiError;
