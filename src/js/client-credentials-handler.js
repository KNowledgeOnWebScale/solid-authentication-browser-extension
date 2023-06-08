import {getAccessToken, getToken, getTokenUrl} from "./solid";
import {createDpopHeader} from "@inrupt/solid-client-authn-core";
import {Handler} from "./handler";

export class ClientCredentialsHandler extends Handler {

  constructor({loggedInCallback, loggedOutCallback}) {
    super();
    this.id = undefined;
    this.secret = undefined;
    this.tokenUrl = undefined;
    this.loggedInCallback = loggedInCallback;
    this.loggedOutCallback = loggedOutCallback;
  }

  ignoreRequest(details) {
    if (!this.isLoggedIn()) {
      console.log(`ClientCredentialsHandler: ignore ${details.url} because not logged in`);
      return true;
    }

    return false;
  }

  async getAuthHeaders(details) {
    const {accessToken, dpopKey} = await getAccessToken(this.id, this.secret, this.tokenUrl);
    const dpop = await createDpopHeader(details.url, "GET", dpopKey);

    return {
      authorization: 'DPoP ' + accessToken,
      dpop
    }
  }

  async login(options) {
    const {oidcIssuer, email, password} = options;
    const credentialsUrl = oidcIssuer + "idp/credentials/";
    this.tokenUrl = await getTokenUrl(oidcissuer);

    const response = await getToken(email, password, credentialsUrl);
    this.id = response.id;
    this.secret = response.secret;

    let success = (id !== undefined && secret !== undefined);

    if (success) {
      this._storeCredentialsInBrowserStorage(id, secret, tokenUrl);
      if (this.loggedInCallback) {
        this.loggedInCallback(true);
      }
    }

    return success;
  }

  logout() {
    this.id = undefined;
    this.secret = undefined;
    this.tokenUrl = undefined;

    this._removeClientCredentialsFromBrowserStorage();

    if (this.loggedOutCallback) {
      this.loggedOutCallback(false);
    }
  }

  isLoggedIn() {
    return this.id === undefined && this.secret === undefined && this.tokenUrl === undefined;
  }

  restore() {
    this._loadFromBrowserStorage("solidCredentials", result => {
      if (result.solidCredentials !== undefined) {
        this.id = result.solidCredentials.id;
        this.secret = result.solidCredentials.secret;
        this.tokenUrl = result.solidCredentials.tokenUrl;
        if (this.loggedInCallback) {
          this.loggedInCallback(true);
        }
      } else {
        if (this.loggedOutCallback) {
          this.loggedOutCallback(false);
        }
      }
    })
  }

  /**
   * Remove any potential client credentials from browser storage
   */
  _removeClientCredentialsFromBrowserStorage() {
    this._removeFromBrowserStorage("solidCredentials");
  }

  /**
   * Remove item from the browser storage before calling a callback function
   * @param {String} item - Name of the item which should be removed from the browser storage
   * @param {Function} callback - Callback function which is called after the item is removed
   */
  _removeFromBrowserStorage(item, callback) {
    chrome.storage.local.remove(item, callback);
  }

  /**
   * Store the current client credentials and token url into the browser storage
   * @param {String} id - Client ID
   * @param {String} secret - Client secret
   * @param {String} tokenUrl - Token url from which access tokens can be requested
   */
  _storeCredentialsInBrowserStorage(id, secret, tokenUrl) {
    this._storeInBrowserStorage({
      solidCredentials: {
        id: id,
        secret: secret,
        tokenUrl: tokenUrl
      }
    })
  }

  /**
   * Store item in the browser storage before calling a callback function
   * @param {String} item - Name of the item which should be loaded from the browser storage
   * @param {Function} callback - Callback function which is called after the item is loaded
   */
  _storeInBrowserStorage(item, callback) {
    chrome.storage.local.set(item, callback);
  }

  /**
   * Load item from the browser storage before calling a callback function with the loaded item as a parameter
   * @param {Object} item - Object containing the item which should be stored in the browser storage
   * @param {Function} callback - Callback function which is called after the item is added
   */
  _loadFromBrowserStorage(item, callback) {
    chrome.storage.local.get(item, callback);
  }
}
