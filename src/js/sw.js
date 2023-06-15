import { OIDCHandler } from "./oidc-handler";

// Polyfilling the localStorage because the solid inrupt packages use this internally
// If you want to use local storage, please use chrome.storage.local directly instead of this instance!
var window = { // eslint-disable-line
  localStorage: {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({ [key]: val }),
    removeItems: keys => chrome.storage.local.remove(keys),
  },
};

const oidcHandler = new OIDCHandler({
  loggedInCallback: () => { },
  loggedOutCallback: () => { }
});

const clientCredentialsHandler = {};
const chrome = chrome;

let authHandler;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('%cON INSTALLED', 'padding: 5px; border-radius: 3px; color: #330; background: #fd1; font-weight: bold;', `Reason: ${reason}`);
});

/**
 * Main function that is called upon extension (re)start
 */
async function main() {
  if (await getCurrentLoginMethod() === 'oidc') {
    authHandler = oidcHandler;
  } else {
    authHandler = clientCredentialsHandler;
  }

  authHandler.loadHistoryFromStorage();
  authHandler.restore();

  /**
   * Runtime message listener, capable of handling and properly awaiting asynchronous functions
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse);
    return true;
  });
};

/**
 *
 * @returns {Promise<unknown>}: "oidc" or "client-credentials".
 */
async function getCurrentLoginMethod() {
  return new Promise(resolve => {
    let method = 'oidc' // Default method

    chrome.storage.local.get('loginMethod', (result) => {
      if (result.loginMethod) {
        method = result.loginMethod;
      }

      resolve(method);
    });
  });
};

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
async function handleMessage(message) {
  if (message.msg === 'login-with-client-credentials') {
    setCurrentLoginMethod('client-credentials');
    authHandler = clientCredentialsHandler;
    authHandler.loadHistoryFromStorage();
    setLatestIDP(message.idp);

    const success = await authHandler.login({
      oidcIssuer: message.idp,
      email: message.email,
      password: message.password
    });

    return {
      success
    };
  } else if (message.msg === 'logout') {
    authHandler.logout();

    return {
      latestIDP: await getLatestIDP(),
      latestWebID: await getLatestWebID()
    };
  } else if (message.msg === 'check-authenticated') {
    console.debug(await getLatestIDP());
    return {
      authenticated: authHandler.isLoggedIn(),
      name: authHandler.getUserName(),
      webId: authHandler.getWebID(),
      latestIDP: await getLatestIDP(),
      latestWebID: await getLatestWebID()
    };
  } else if (message.msg === 'login-with-oidc') {
    setCurrentLoginMethod('oidc');
    authHandler = oidcHandler;
    authHandler.loadHistoryFromStorage();
    setLatestIDP(message.oidcIssuer);
    if (message.webId) {
      setLatestWebID(message.webId);
    }
    authHandler.login({ oidcIssuer: message.oidcIssuer });
  } else if (message.msg === 'show-history') {
    chrome.tabs.create({ url: '/history/index.html' });
  } else if (message.msg === 'clear-history') {
    authHandler.clearHistory();
  }
}

main();
