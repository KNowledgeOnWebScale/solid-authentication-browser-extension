const EXTENSION_ID = 'lfmjmfikelnaphplfdkbkmepacogciai';
const DEBUG = true;

export default class IdentityWidget {
  port;
  identityChangedHandler;
  activeIdentity;

  constructor() {
    this._connect();
  }

  /**
   * PRIVATE METHODS
   */

  _connect() {
    this._initializeConnection();
  }

  _initializeConnection = () => {
    this.port = chrome.runtime.connect(EXTENSION_ID);
    this.port.onDisconnect.addListener(this._handleDisconnect);
    this.port.onMessage.addListener(this._handleMessageFromExtension);
    this.port.postMessage({ type: 'request-active-identity' });
  }

  _handleDisconnect = () => {
    if (DEBUG) {
      console.log('%cDISCONNECT', 'padding: 5px; border-radius: 3px; background: #ff3333; font-weight: bold; color: white', 'Extension got disconnected, replenishing connections...');
    }

    this._initializeConnection();
  }

  _handleMessageFromExtension = (message) => {
    if (DEBUG) {
      console.log('%cINCOMING MESSAGE', 'padding: 5px; border-radius: 3px; background: #3347ff; font-weight: bold; color: white', message);
    }

    if (!message.type) {
      console.error('Non-conformal message detected, omitting...');
      return;
    }

    if (message.type === 'active-identity-response') {
      if (message.data) {
        this.identityChangedHandler(message.data);
        this.activeIdentity = message.data;
      }
    }
  }

  /**
   * PUBLIC METHODS
   */

  getIdentities = () => {
    this.port.postMessage('request-identities');
  }

  onIdentityChanged = (callback) => {
    this.identityChangedHandler = callback;
  }
}