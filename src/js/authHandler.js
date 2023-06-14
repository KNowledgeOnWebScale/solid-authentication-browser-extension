export class AuthenticationHandler {
  HISTORY_LIMIT = 1000;

  constructor() {
    this.history = [];
  }

  async saveRequestToHistory(details) {
      if (this.history.length === this.HISTORY_LIMIT) {
        this.history.shift();
      }

      let {method, url, date, webId} = details;

      if (!date) {
        date = new Date();
      }

      this.history.push({method, url, date, webId});

      chrome.storage.local.set({history: this.history});
  }

  getHistory() {
    return this.history;
  }

  async loadHistoryFromStorage() {
      this.history = (await this._getHistoryFromStorage()) || [];
      console.debug(this.history);
      console.debug(`Handler: loaded history from storage (${this.history.length} requests).`);
  }

  /**
   * This method clears the request history.
   */
  clearHistory() {
    this.history = [];
    chrome.storage.local.set({history: this.history});
  }

  ignoreRequest(details) {
    throw new Error("You must implement the method ignoreRequest.");
  }

  async getAuthHeaders(details) {
    throw new Error("You must implement the method getAuthHeaders.");
  }

  login(oidcIssuer) {
    throw new Error("You must implement the method login.");
  }

  async logout() {
    throw new Error("You must implement the method logout.");
  }

  isLoggedIn() {
    throw new Error("You must implement the method isLoggedIn.");
  }

  restore() {
    throw new Error("You must implement the method restore.");
  }

  cleanUpRequest(url) {
    // Implementing this method is not required.
  }

  getUserName() {
    return null;
  }

  /**
   * Returns the WebID of the logged-in agent.
   * @returns {null}
   */
  getWebID() {
    return null;
  }

  async _getHistoryFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get('history', result => {
        let {history} = result;
        console.debug(history);
        resolve(history);
      });
    });
  }
}
