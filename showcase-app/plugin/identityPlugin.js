import { QueryEngine } from '@comunica/query-sparql';

const EXTENSION_ID = 'lfmjmfikelnaphplfdkbkmepacogciai';
const DEBUG = true;

/**
 * This widget servers as a (temporary or not) interface between a solid application and the identity chrome extension
 * The idea of this widget is to make life easier developing a solid app that can make use of identities/profiles defined by the user in a single location
 * Ideally the extension leverages user effort to keep profiles in one place
 * The widget is more a developer-experience enhancement for those developing solid apps
 * The widget acts as a bridget between a solid app living in the scope of a single tab to get profiles and updates from the extension
 */
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
    // Connection is opened (allows messages to be sent/received)
    // Initialization is concluded by requesting the active identity from the extension
    this.port = chrome.runtime.connect(EXTENSION_ID);
    this.port.onDisconnect.addListener(this._handleDisconnect);
    this.port.onMessage.addListener(this._handleMessageFromExtension);
    this.port.postMessage({ type: 'request-active-identity' });
  }

  _handleDisconnect = () => {
    if (DEBUG) {
      console.log('%cDISCONNECT', 'padding: 5px; border-radius: 3px; background: #ff3333; font-weight: bold; color: white', 'Extension got disconnected, replenishing connections...');
    }

    // TODO: Long-lived connections will shut down after a longer period of inactivity. They are hydrated by opening the connection again after it is closed
    // The idea is to only update the connection when it is absolutely needed
    // Keep-alive mechanism TODO: check if there isn't a better way of handling this
    this._initializeConnection();
  }

  /**
   * Handle messages sent from the extension
   */
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
        // All identities either have an IDP of WebID stored onto them
        // We want to determine which one to use
        let idpOrWebID = message.data.idp;

        if (message.data.webID) {
          // IF the identity has a WebID, we need to figure out which IDP to redirect to
          const idps = await this._getIDPsFromWebID(message.data.webID)

          // In the end we set the IDP anyway. User gets redirected to IDP. If it supports more than one WebID, the user can confirm or select the correct one there.
          if (idps.length) {
            idpOrWebID = idps[0];
          }
        }

        // Make the received identity actual
        this.activeIdentity = {
          ...message.data,
          idpOrWebID,
        };

        // Fire the change handler
        // The Solid App can subscribe to this event to handle any changes in the app to triggere required behaviour
        this.identityChangedHandler({
          ...this.activeIdentity,
        });
      }
    }
  }

  /**
   * Queries for an IDP for a given WebID
   * We use the IDPs generally for redirecting the user to the login/authorization flow of their IDP
   * TODO: If your WebID does not exist or the IDP cannot be determined, this will fail with an error and no fallback
   */
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

  /**
   * Gets all identities currently available in the extension
   */
  getIdentities = () => {
    // This method promisifies feedback from the async flow imposed by usage of messaging ports
    return new Promise((resolve) => {
      // We define the function (inside this promise) to handle incoming messages from the chrome extension
      const handleRequest = (message) => {
        if (message.type === 'all-identities-response') {
          // We resolve the promise with the required data and then perform cleanup
          resolve(message.data);
          this.port.onMessage.removeListener(handleRequest);
        }
      };

      // Subscribe new message handler and then fire the message to the extension to kickstart the start of the entire cycle, requesting all identities
      this.port.onMessage.addListener(handleRequest);
      this.port.postMessage({ type: 'request-identities' });
    });
  }

  /**
   * Call this method with the function you want to execute whenever a profile change occurs
   * @param callback A function called upon identity change. The parameter it's called with is the new identity that was changed to
   */
  onIdentityChanged = (callback) => {
    this.identityChangedHandler = callback;
  }

  /**
   * Updates the profile in the extension
   * Call this function if you want to change a user's profile or annotate it with new data
   * A profile can have a metadata Object { name: ? } with a name property (currently) which can then show more data coming from - for example - the pod, in the extension
   */
  updateProfile = (identity) => {
    this.port.postMessage({
      type: 'update-profile',
      data: {
        ...identity,
      },
    });
  }
}
