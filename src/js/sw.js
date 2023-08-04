import { v4 as uuid } from 'uuid';

let activeIdentity;
let availableIdentities = [];

let externalPort;
let internalPort;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('%cON INSTALLED', 'padding: 5px; border-radius: 3px; color: #330; background: #fd1; font-weight: bold;', `Reason: ${reason}`);
});

/**
 * Main function that is called upon extension (re)start
 */
async function main() {
  // Manage connection to the webpage and popup
  chrome.runtime.onConnectExternal.addListener((port) => {
    externalPort = port;
    port.onMessage.addListener(handleExternalMessage);
  });

  chrome.runtime.onConnect.addListener((port) => {
    internalPort = port;
    port.onMessage.addListener(handleInternalMessage);
  });

  // Uncomment this line, and reload the extension to clear any stored data
  // Stored data cannot be found in
  // chrome.storage.local.clear();

  const storedIdentities = (await chrome.storage.local.get(['availableIdentities'])).availableIdentities;
  activeIdentity = (await chrome.storage.local.get(['activeIdentity'])).activeIdentity;

  if (storedIdentities) {
    availableIdentities = storedIdentities;
  } else {
    availableIdentities = [];
  }
}

const broadcast = (message) => {
  internalPort.postMessage(message);

  if (externalPort) {
    externalPort.postMessage(message);
  }
}

const handleInternalMessage = async (message) => {
  console.log('%cINTERNAL MESSAGE', 'padding: 5px; border-radius: 3px; background: #1db94a; font-weight: bold; color: white', message);

  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type === 'set-active-identity') {
    activeIdentity = message.data;
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
      ...message.data
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
    const indexToUpdate = availableIdentities.findIndex(({ id }) => message.data.id === id);

    availableIdentities.splice(indexToUpdate, 1, {
      ...message.data
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
    const indexToRemove = availableIdentities.findIndex(({ id }) => message.data.id === id);

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

    return;
  }
};

const handleExternalMessage = async (message) => {
  console.log('%cEXTERNAL MESSAGE', 'padding: 5px; border-radius: 3px; background: #3347ff; font-weight: bold; color: white', message);

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
    const indexToUpdate = availableIdentities.findIndex(({ id }) => message.data.id === id);

    availableIdentities.splice(indexToUpdate, 1, {
      ...message.data
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
}

main();
