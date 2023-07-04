let availableIdentities = [];
let internalPort;

const main = () => {
  internalPort = chrome.runtime.connect({ name: 'popup' });
  internalPort.onMessage.addListener(handleInternalMessage);
  internalPort.postMessage({ type: 'request-identities' });
  internalPort.postMessage({ type: 'request-active-identity' });

  document.getElementById('add-identity-button').addEventListener('click', () => {
    createNewIdentity();
  });
}

const handleInternalMessage = (message) => {
  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type === 'active-identity-response') {
    setActiveIdentity(message.data);

    return;
  }

  if (message.type === 'all-identities-response') {
    availableIdentities = message.data;
    const list = document.getElementById('identity-list');
    const listAddButton = document.getElementById('add-identity-button');

    availableIdentities.forEach((identity) => {
      const identityRow = createIdentityRow(identity);
      list.insertBefore(identityRow, listAddButton);
    });

    return;
  }
};

const createNewIdentity = () => {
  createCenteredPopup(
    420,
    640,
    { url: chrome.runtime.getURL("identity-creation.html"), type: "popup" },
  );
};

const createCenteredPopup = (width, height, options) => {
  const left = (screen.width / 2) - (width / 2);
  const top = (screen.height / 2) - (height / 2);

  chrome.windows.create({
    ...options,
    width,
    height,
    left,
    top,
  });
};

const createIdentityRow = (identity) => {
  const identityRow = document.createElement('li');
  identityRow.classList.add('identity-row');
  const avatar = document.createElement('span');
  avatar.classList.add('avatar', 'small');
  avatar.setAttribute('style', `background-color: ${identity.color.background}; color: ${identity.color.color}`);
  const displayName = document.createElement('span');

  avatar.innerHTML = identity.displayName.charAt(0);
  displayName.innerHTML = identity.displayName;

  identityRow.appendChild(avatar);
  identityRow.appendChild(displayName);

  identityRow.addEventListener('click', () => {
    internalPort.postMessage({
      type: 'set-active-identity',
      data: identity
    });
  });

  return identityRow;
};

const setActiveIdentity = (identity) => {
  document.getElementById('no-identities-prompt').classList.add('hidden');
  document.getElementById('identity-short').innerHTML = identity.displayName;

  const identityHeader = document.getElementById('identity-header');
  const avatar = identityHeader.querySelector('.avatar');
  avatar.innerHTML = identity.displayName[0];
  avatar.setAttribute('style', `background-color: ${identity.color.background}; color: ${identity.color.color}`);
  identityHeader.classList.remove('hidden');
}

main();
