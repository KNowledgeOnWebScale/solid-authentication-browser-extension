
export class PopupStorage {

  constructor() {
  }

  delete(key) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        msg: "local-storage-delete",
        key
      }, () => {
        console.log(`PopupStorage:delete: ${key} (string: ${this._isString(key)})`);
        resolve();
      });
    });
  }

  get(key) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        msg: "local-storage-get",
        key
      }, (value) => {
        console.log(`PopupStorage:set: ${key} (string: ${this._isString(key)}) = ${value}`);
        resolve(value);
      });
    });
  }

  set(key, value) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        msg: "local-storage-set",
        key,
        value
      }, () => {
        console.log(`PopupStorage:set: ${key} (string: ${this._isString(key)}) --> ${value}`);
        resolve();
      });
    });
  }

  _isString(val) {
    return typeof val === 'string' || val instanceof String;
  }
}
