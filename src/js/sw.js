import { OIDCHandler } from "./oidc-handler";

const oidcHandler = new OIDCHandler({
  loggedInCallback: () => {},
  loggedOutCallback: () => {}
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(reason);
});

let authHandler;

// Polyfilling the localStorage because the solid inrupt packages use this internally
// If you want to use local storage, please use chrome.storage.local directly instead of this instance!
var window = {
  localStorage: {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  },
};

/**
 * Main function that is called upon extension (re)start
 */
async function main() {
  if (await getCurrentLoginMethod() === 'oidc') {
    authHandler = oidcHandler;
  } else {
    authHandler = clientCredentialsHandler;
  }

  console.log(authHandler);
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

main();
