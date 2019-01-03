let ReactNative = require('react-native');

let AsyncStorage = ReactNative.AsyncStorage;

module.exports = class ReactNativeAsyncStorage {
  constructor(opts) {
    this._opts = { ...opts };
    this._prefix = this._opts.prefix || '$$GhostClient:';
  }

  async setAsync(key, value) {
    await AsyncStorage.setItem(this._prefix + key, JSON.stringify(value));
  }

  async getAsync(key) {
    let jsonValue = await AsyncStorage.getItem(this._prefix + key);
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
  }

  async deleteAsync(key) {
    await AsyncStorage.removeItem(this._prefix + key);
  }
}
