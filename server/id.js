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

function _normalizeInfo(s, maxLength) {
  maxLength = maxLength || 48;
  let n = s.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '-');
  if (n.length > maxLength) {
    n = n.substr(0, maxLength);
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
  return type + ':' + _normalizeInfo(s);
}

async function createUniqueIdAsync(type, s, existsAsync) {
  let id = createId(type, s);
  while (await existsAsync(id)) {
    id = id.substr(0, 48) + '--' + makeUuid(8);
  }
  return id;
}

module.exports = {
  makeUuid,
  createId,
  createUniqueIdAsync,
  md5,
};
