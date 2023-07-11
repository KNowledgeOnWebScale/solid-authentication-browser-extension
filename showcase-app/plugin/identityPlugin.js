import { QueryEngine } from '@comunica/query-sparql';

const EXTENSION_ID = 'lfmjmfikelnaphplfdkbkmepacogciai';
const DEBUG = true;

export default class IdentityWidget {
  port;
  identityChangedHandler;
  activeIdentity;

  constructor() {
    this._initializeConnection();
  }

  /**
   * PRIVATE METHODS
   */

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

    // Keep-alive mechanism TODO: check if there isn't a better way of handling this
    this._initializeConnection();
  }

  _handleMessageFromExtension = async (message) => {
    if (DEBUG) {
      console.log('%cINCOMING MESSAGE', 'padding: 5px; border-radius: 3px; background: #3347ff; font-weight: bold; color: white', message);
    }

    if (!message.type) {
      console.error('Non-conformal message detected, omitting...');
      return;
    }

    if (message.type === 'active-identity-response') {
      if (message.data) {
        let idpOrWebID = message.data.idp;

        if (message.data.webID) {
          const idps = await this._getIDPsFromWebID(message.data.webID)

          if (idps.length) {
            idpOrWebID = idps[0];
          }
        }

        this.activeIdentity = {
          ...message.data,
          idpOrWebID,
        };

        this.identityChangedHandler({
          ...this.activeIdentity,
        });
      }
    }
  }

  async _getIDPsFromWebID(webId) {
    const myEngine = new QueryEngine();
    const bindingsStream = await myEngine.queryBindings(`
    SELECT ?idp WHERE {
      <${webId}> <http://www.w3.org/ns/solid/terms#oidcIssuer> ?idp
    } LIMIT 10`, {
      sources: [webId],
    });

    const bindings = await bindingsStream.toArray();
    return bindings.map(a => a.get('idp').value);
  }

  /**
   * PUBLIC METHODS (API)
   */

  getIdentities = () => {
    return new Promise((resolve) => {
      const handleRequest = (message) => {
        if (message.type === 'all-identities-response') {
          resolve(message.data);
          this.port.onMessage.removeListener(handleRequest);
        }
      };

      this.port.onMessage.addListener(handleRequest);
      this.port.postMessage({ type: 'request-identities' });
    });
  }

  onIdentityChanged = (callback) => {
    this.identityChangedHandler = callback;
  }
}
