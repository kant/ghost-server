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

function normalizeInfo(s, maxLength) {
  maxLength = maxLength || 48;
  s = s || '';
  let n = s
    .toLowerCase()
    .replace(/[ \.]/g, '-')
    .replace(/[^-a-zA-Z0-9_]/g, '');
  if (n.length > maxLength) {
    n = n.substr(0, maxLength);
  }
  return n;
}

function createId(type, s) {
  return type + ':' + normalizeInfo(s);
}

function makeOpaqueId(type) {
  return type + ':' + makeUuid(16);
}

module.exports = {
  makeUuid,
  createId,
  makeOpaqueId,
  normalizeInfo,
};
