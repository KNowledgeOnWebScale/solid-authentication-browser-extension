/**
 * Manifest V3 Service Worker for Chrome extension.
 */

import { v4 as uuid } from 'uuid';
import { QueryEngine } from '@comunica/query-sparql';

let activeIdentity;
let availableIdentities = [];

let externalPort;
let internalPort;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log(
    '%cON INSTALLED',
    'padding: 5px; border-radius: 3px; color: #330; background: #fd1; font-weight: bold;',
    `Reason: ${reason}`,
  );
});

/**
 * Main function that is called upon extension (re)start.
 */
async function main() {
  // Set up the messaging port to share data with Solid Apps in tabs.
  chrome.runtime.onConnectExternal.addListener((port) => {
    console.log('New app connected on port', port);
    externalPort = port;
    port.onMessage.addListener(handleExternalMessage);
  });

  // Set up the messaging port to share data with the extension's popups and separate windows.
  chrome.runtime.onConnect.addListener((port) => {
    internalPort = port;
    port.onMessage.addListener(handleInternalMessage);
  });

  // Uncomment this line, and reload the extension to clear any stored data.
  // chrome.storage.local.clear();

  // Get all identities created previously by the user.
  const storedIdentities = (
    await chrome.storage.local.get(['availableIdentities'])
  ).availableIdentities;
  activeIdentity = (await chrome.storage.local.get(['activeIdentity']))
    .activeIdentity;

  if (storedIdentities) {
    availableIdentities = storedIdentities;
  } else {
    availableIdentities = [];
  }
}

/**
 * Posts a message to all connected apps (tabs) and internal windows/popups.
 * @param {string} message The message to broadcast.
 */
const broadcast = (message) => {
  internalPort.postMessage(message);

  if (externalPort) {
    externalPort.postMessage(message);
  }
};

/**
 * Queries for an IDP for a given WebID.
 * We use the IDPs generally for redirecting the user to the login/authorization flow of their IDP.
 * TODO: If your WebID does not exist or the IDP cannot be determined, this will fail with an error and no fallback.
 * See https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/issues/48.
 * @param {string} webId - The WebID.
 * @returns {Promise<string[]>} - The IDPs.
 */
async function getIDPsFromWebID(webId) {
  const myEngine = new QueryEngine();
  const bindingsStream = await myEngine.queryBindings(
    `
    SELECT ?idp WHERE {
      <${webId}> <http://www.w3.org/ns/solid/terms#oidcIssuer> ?idp
    } LIMIT 10`,
    {
      sources: [webId],
    },
  );

  const bindings = await bindingsStream.toArray();
  return bindings.map((a) => a.get('idp').value);
}

/**
 * Message handler for all messages from popups and windows within the extension scope.
 * @param {object} message The received message.
 * @param {string} message.type - The message type.
 */
const handleInternalMessage = async (message) => {
  console.log(
    '%cINTERNAL MESSAGE',
    'padding: 5px; border-radius: 3px; background: #1db94a; font-weight: bold; color: white',
    message,
  );

  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type === 'set-active-identity') {
    activeIdentity = message.data;

    let idpOrWebID = activeIdentity.idp;
    if (activeIdentity.webID) {
      const idps = await getIDPsFromWebID(activeIdentity.webID);
      // In the end we set the IDP anyway. User gets redirected to IDP. If it supports more than one WebID, the user can confirm or select the correct one there.
      if (idps.length) {
        idpOrWebID = idps[0];
      }
    }
    activeIdentity.idpOrWebID = idpOrWebID;

    chrome.storage.local.set({ activeIdentity });

    broadcast({
      type: 'active-identity-response',
      data: activeIdentity,
    });

    return;
  }

  if (message.type === 'request-active-identity') {
    if (!activeIdentity) {
      console.warn('No active identity!');
      return;
    }

    internalPort.postMessage({
      type: 'active-identity-response',
      data: activeIdentity,
    });

    return;
  }

  if (message.type === 'request-identities') {
    internalPort.postMessage({
      type: 'all-identities-response',
      data: availableIdentities,
    });

    return;
  }

  if (message.type === 'create-profile') {
    activeIdentity = {
      id: uuid(),
      ...message.data,
    };

    availableIdentities.push(activeIdentity);
    chrome.storage.local.set({ availableIdentities });
    chrome.storage.local.set({ activeIdentity });

    broadcast({
      type: 'active-identity-response',
      data: activeIdentity,
    });

    return;
  }

  if (message.type === 'update-profile') {
    // Find and replace the profile in the list of available identities
    const indexToUpdate = availableIdentities.findIndex(
      ({ id }) => message.data.id === id,
    );

    availableIdentities.splice(indexToUpdate, 1, {
      ...message.data,
    });

    // Persist the list of identities to storage
    chrome.storage.local.set({ availableIdentities });

    // Notify all connected components about the new source of truth
    broadcast({
      type: 'all-identities-response',
      data: availableIdentities,
    });

    // Check if the selected profile affected
    if (activeIdentity.id === message.data.id) {
      activeIdentity = message.data;
    }

    return;
  }

  if (message.type === 'delete-profile') {
    // Find and delete the profile in the list of available identities
    const indexToRemove = availableIdentities.findIndex(
      ({ id }) => message.data.id === id,
    );

    availableIdentities.splice(indexToRemove, 1);

    // Persist the list of identities to storage
    chrome.storage.local.set({ availableIdentities });

    // Notify all connected components about the new source of truth
    broadcast({
      type: 'all-identities-response',
      data: availableIdentities,
    });

    // Check if the selected profile affected
    if (activeIdentity.id === message.data.id) {
      activeIdentity = undefined;
    }
  }
};

/**
 * Message handler for all messages from a Solid App (separate context in a tab).
 * @param {object} message The message to send.
 * @param {string} message.type - The message type.
 * @param {object} message.data - The message data.
 */
const handleExternalMessage = async (message) => {
  console.log(
    '%cEXTERNAL MESSAGE',
    'padding: 5px; border-radius: 3px; background: #3347ff; font-weight: bold; color: white',
    message,
  );

  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type === 'request-active-identity') {
    externalPort.postMessage({
      type: 'active-identity-response',
      data: activeIdentity,
    });

    return;
  }

  if (message.type === 'request-identities') {
    externalPort.postMessage({
      type: 'all-identities-response',
      data: availableIdentities,
    });

    return;
  }

  if (message.type === 'update-profile') {
    // Find and replace the profile in the list of available identities
    const indexToUpdate = availableIdentities.findIndex(
      ({ id }) => message.data.id === id,
    );

    availableIdentities.splice(indexToUpdate, 1, {
      ...message.data,
    });

    // Persist the list of identities to storage
    chrome.storage.local.set({ availableIdentities });

    // Notify all connected components about the new source of truth
    broadcast({
      type: 'all-identities-response',
      data: availableIdentities,
    });

    // Check if the selected profile affected
    if (activeIdentity.id === message.data.id) {
      activeIdentity = message.data;
    }
  }
};

main();
