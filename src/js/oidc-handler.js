import {Session} from "@inrupt/solid-client-authn-browser";
import {Handler} from "./handler";
import {sendHead} from "./solid";
import {findHeader} from "./utils";

export class OIDCHandler extends Handler {

  constructor({loggedInCallback, loggedOutCallback}) {
    super();
    this.pendingRequests = {};
    this._createNewSession();
    this.loggedInCallback = loggedInCallback;
    this.loggedOutCallback = loggedOutCallback;
  }

  ignoreRequest(details) {
    const {requestHeaders, url, requestId} = details;

    if (findHeader(requestHeaders, 'x-solid-extension') === 'sniff-headers') {
      console.debug(`OIDCHandler: ignore ${url} (${requestId}) because header 'x-solid-extension' with 'sniff-headers' is present.`);
      return true;
    }

    if (findHeader(requestHeaders, 'authorization') || findHeader(requestHeaders, 'dpop')) {
      console.debug(`OIDCHandler: ignore ${url} (${requestId}) because authorization and dpop headers are already present.`);
      return true;
    }

    if (!this.session.info.isLoggedIn) {
      console.debug(`OIDCHandler: ignore ${url} (${requestId}) because not logged in.`);
      return true;
    }

    return false;
  }

  async getAuthHeaders(details) {
    const {url, method, requestId} = details;
    this.pendingRequests[requestId] = {
      status: 'pending'
    };

    const statusCode = await sendHead(url);

    if (method === 'GET' && statusCode !== 401) {
      console.debug(`rewriteRequestHeadersUsingOIDC: ignore ${url} (${requestId}) because status ${statusCode} !== 401`);
      this.pendingRequests[requestId].headers = [];
      this.pendingRequests[requestId].status = 'headers available';
      return {dpop: undefined, authorization: undefined};
    }

    try {
      await this.session.fetch(url, {
        method,
        headers: {
          'x-solid-extension': 'sniff-headers',
          'x-solid-request-id': requestId
        }
      });
    } catch (e) {
      // This error is expected, because the fetch is only done to get the headers.
    }

    console.log(this.pendingRequests[requestId]);

    return {
      authorization: findHeader(this.pendingRequests[requestId].headers, 'authorization'),
      dpop: findHeader(this.pendingRequests[requestId].headers, 'dpop')
    }
  }

  checkForOIDCRedirect(details) {
    console.log('OIDC redirect captured: ', details.url);
    this.session.handleIncomingRedirect(details.url).then(info => {
      console.log('a', info);
      if (this.session.info.isLoggedIn && this.loggedInCallback) {
        this.loggedInCallback();
      }
    });
    chrome.tabs.remove(this.tab.id);

    return { cancel: true }
  }

  checkForPendingRequests(details) {
    const {requestHeaders} = details;

    if (findHeader(requestHeaders, 'x-solid-extension') === 'sniff-headers') {
      const requestId = findHeader(requestHeaders, 'x-solid-request-id');
      this.pendingRequests[requestId].headers = requestHeaders;
      this.pendingRequests[requestId].status = 'headers available';
      console.log(requestHeaders);
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
      console.debug('Not logging out because not logged in.');
      return
    }

    await this.session.logout();
    this._createNewSession();
    this.pendingRequests = {};
    if (this.loggedOutCallback) {
      this.loggedOutCallback()
    }
  }

  isLoggedIn() {
    return this.session.info.isLoggedIn;
  }

  restore() {
    // TODO
    if (this.isLoggedIn() && this.loggedInCallback) {
      this.loggedInCallback(true);
    } else if (this.loggedOutCallback) {
      this.loggedOutCallback();
      console.log('OIDCHandler: no session restored.');
    }
  }

  _createNewSession() {
    this.session = new Session();
    this.session.clientAuthentication.cleanUrlAfterRedirect = () => {};
  }

  cleanUpRequest(requestId) {
    delete this.pendingRequests[requestId];
  }

  getUserName() {
    if (!this.isLoggedIn()) {
      return null;
    }

    return this.session.info.webId;
  }

  getWebID() {
    if (!this.isLoggedIn()) {
      return null;
    }

    return this.session.info.webId;
  }

  async saveRequestToHistory(details) {
    details.webId = this.session.info.webId;
    await super.saveRequestToHistory(details);
  }
}
