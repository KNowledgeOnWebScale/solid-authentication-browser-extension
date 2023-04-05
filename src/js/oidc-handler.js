import {Session} from "@inrupt/solid-client-authn-browser";
import {Handler} from "./handler";

export class OIDCHandler extends Handler {

  constructor({loggedInCallback, loggedOutCallback}) {
    super();
    this.pendingRequests = {};
    this._createNewSession();
    this.loggedInCallback = loggedInCallback;
    this.loggedOutCallback = loggedOutCallback;
  }

  ignoreRequest(details) {
    if (this._findHeader(details.requestHeaders, 'x-solid-extension') === 'sniff-headers') {
      console.log(`OIDCHandler: ignore ${details.url} because ${this._findHeader(details.requestHeaders, 'x-solid-extension')}`);
      return true;
    }

    if (!this.session.info.isLoggedIn) {
      console.log(`OIDCHandler: ignore ${details.url} because not logged in`);
      return true;
    }

    return false;
  }

  async getAuthHeaders(details) {
    this.pendingRequests[details.url] = {
      status: 'pending'
    };
    console.log(this.pendingRequests[details.url]);
    try {
      await this.session.fetch(details.url, {
        headers: {
          'x-solid-extension': 'sniff-headers'
        }
      });
    } catch (e) {
      // This error is expected, because the fetch is only done to get the headers.
    }

    console.log(this.pendingRequests[details.url]);

    return {
      authorization: this._findHeader(this.pendingRequests[details.url].headers, 'authorization'),
      dpop: this._findHeader(this.pendingRequests[details.url].headers, 'dpop')
    }
  }

  checkForOIDCRedirect(details) {
    console.log('web request made', details.url);
    this.session.handleIncomingRedirect(details.url).then(info => {
      console.log('a', info);
      if (this.session.info.isLoggedIn && this.loggedInCallback) {
        this.loggedInCallback(true);
      }
    });
    chrome.tabs.remove(this.tab.id);
    return { cancel: true }
  }

  checkForPendingRequests(details) {
    if (this._findHeader(details.requestHeaders, 'x-solid-extension') === 'sniff-headers') {
      this.pendingRequests[details.url].headers = details.requestHeaders;
      this.pendingRequests[details.url].status = 'headers available';
      console.log(details.requestHeaders);
      return {cancel: true};
    }
  }

  login(options) {
    const {oidcIssuer} = options;
    return this.session.login({
      redirectUrl: 'https://whateveryouwant-solid.com/',
      handleRedirect: (url) => {
        this.tab = chrome.tabs.create({ url }, t => { this.tab = t });
      },
      oidcIssuer,
      clientName: 'Solid Authentication'
    });
  }

  async logout() {
    if (!this.isLoggedIn()) {
      return
    }

    await this.session.logout();
    this._createNewSession();
    this.pendingRequests = {};
    if (this.loggedOutCallback) {
      this.loggedInCallback(false)
    }
  }

  isLoggedIn() {
    return this.session.info.isLoggedIn;
  }

  _createNewSession() {
    this.session = new Session();
    this.session.clientAuthentication.cleanUrlAfterRedirect = () => {};
  }

  cleanUpRequest(url) {
    delete this.pendingRequests[url];
  }

  _findHeader(requestHeaders, headerName) {
    if (!requestHeaders) {
      return null;
    }

    let i = 0;

    while(i < requestHeaders.length && requestHeaders[i].name !== headerName) {
      i ++;
    }

    if (i < requestHeaders.length) {
      return requestHeaders[i].value;
    }

    return null;
  }
}
