let activeIdentity = {
  type: 'Identity',
  name: 'John Doe',
  webId: 'some-web-id',
};

let activePort;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('%cON INSTALLED', 'padding: 5px; border-radius: 3px; color: #330; background: #fd1; font-weight: bold;', `Reason: ${reason}`);
});

/**
 * Main function that is called upon extension (re)start
 */
async function main() {
  chrome.runtime.onConnectExternal.addListener((port) => {
    activePort = port;
    port.onMessage.addListener(handleMessage);
  });
  /**
   * Runtime message listener, capable of handling and properly awaiting asynchronous functions
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse);
    return true;
  });
}

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
const handleMessage = async (message) => {
  console.log('%cINCOMING MESSAGE', 'padding: 5px; border-radius: 3px; background: #3347ff; font-weight: bold; color: white', message);

  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type && message.type === 'request-active-identity') {
    activePort.postMessage({
      type: 'identity-response',
      data: activeIdentity,
    });

    return;
  }
}

main();
