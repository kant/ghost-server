let crypto = require('crypto');

let uuidV4 = require('uuid/v4');

function makeUuid(length = 27) {
  // Can make about 90 of these per ms on a computer

  let UUID_LENGTH = length;
  let UUID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  UUID_ALPHABET = 'abcdefghijklmnopwrstuvwxz234679';

  let bytes = new Array(32);
  uuidV4(null, bytes, 0);
  uuidV4(null, bytes, 16);

  let body = bytes
    .slice(0, UUID_LENGTH)
    .map((byte) => UUID_ALPHABET[byte % UUID_ALPHABET.length])
    .join('');
  return body;
}

function _normalizeInfo(s) {
  let n = s.replace(/[^a-zA-Z0-9_]/, '-');
  if (n.length > 40) {
    n = n.substr(0, 40);
  }
  return n;
}

function md5(message, length) {
  let h = crypto
    .createHash('md5')
    .update(message)
    .digest('hex');
  if (length) {
    return h.substr(0, length);
  } else {
    return h;
  }
}

function createId(type, s) {
  let data;
  if (s) {
    let n = _normalizeInfo(s);
    if (n === s) {
      data = n;
    } else {
      data = n + '.' + md5(s, 8);
    }
  } else {
    data = makeUuid();
  }
  return type + ':' + data;
}

module.exports = {
  makeUuid,
  createId,
  md5,
};
