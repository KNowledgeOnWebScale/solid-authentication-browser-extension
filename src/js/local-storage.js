
export class LocalStorage {

  constructor() {
  }

  delete(key) {
    return new Promise(async resolve => {
      await chrome.storage.local.remove(key);
      resolve();
    });
  }

  get(key) {
    return new Promise(async resolve => {
      chrome.storage.local.get(key, value => {
        console.log(`LocalStorage:get: ${key} (string: ${this._isString(key)}) = ${value}`);
        if (typeof value === 'object') {
          console.log('This is an object:');
          console.log(JSON.stringify(value));
          value = value[key];
        }
        resolve(value);
      });

    });
  }

  set(key, value) {
    console.log(`LocalStorage:set: ${key} (string: ${this._isString(key)}) --> ${value}`);
    return new Promise(async resolve => {
      const keys = {};
      keys[key] = value;
      await chrome.storage.local.set(keys);
      console.log(`This was stored: ` + await chrome.storage.local.get(key));
      resolve();
    });
  }

  _isString(val) {
    return typeof val === 'string' || val instanceof String;
  }
}
