import { OIDCHandler } from "./oidc-handler";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(reason);
});

let authHandler;

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
