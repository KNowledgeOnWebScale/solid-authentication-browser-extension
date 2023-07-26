let internalPort;
let availableIdentities = [];
let selectedIdentity;

const avatarColors = [
  {
    id: 'purple',
    background: '#7b4dff',
    color: 'white',
  },
  {
    id: 'orange',
    background: '#ff833b',
    color: 'white',
  },
  {
    id: 'brown',
    background: '#8e6231',
    color: 'white',
  },
  {
    id: 'blue',
    background: '#283cf2',
    color: 'white',
  },
  {
    id: 'red',
    background: '#e93a2a',
    color: 'white',
  },
];

let avatar;
let activeColor = avatarColors[0];
let profileEditDialog;
let confirmDialog;

let formErrors = [];

const main = () => {
  internalPort = chrome.runtime.connect({ name: 'create' });
  internalPort.onMessage.addListener(handleMessage);
  avatar = document.getElementById('avatar');

  generateColorSelection();
  updateAvatar();

  const displayNameInputField = document.getElementById('display-name');
  const idpInputField = document.getElementById('idp');
  const webIdInputField = document.getElementById('webid');

  displayNameInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    selectedIdentity.displayName = value;
    updateAvatarContent(value);
  });

  idpInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    selectedIdentity.idp = value;
    setMutuallyExclusiveField();
  });

  webIdInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    selectedIdentity.webID = value;
    setMutuallyExclusiveField();
  });

  profileEditDialog = document.getElementById('profile-edit-dialog');
  const profileDialogContent = document.getElementById('profile-edit-dialog-content');
  const confirmDialogContent = document.getElementById('confirm-dialog-content');
  confirmDialog = document.getElementById('confirm-dialog');

  profileEditDialog.addEventListener('click', () => {
    profileEditDialog.close();
  });

  confirmDialog.addEventListener('click', () => {
    confirmDialog.close();
  });

  profileDialogContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  confirmDialogContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('save-button').addEventListener('click', saveProfile);
  document.getElementById('delete-button').addEventListener('click', deleteProfile);
  document.getElementById('cancel-button').addEventListener('click', () => confirmDialog.close());
  internalPort.postMessage({ type: 'request-identities' });
};

const saveProfile = (e) => {
  const formIsValid = validateForm();

  if (formIsValid) {
    internalPort.postMessage({
      type: 'update-profile',
      data: {
        ...selectedIdentity,
      },
    });
    profileEditDialog.close();
  }

  e.preventDefault();
};

const deleteProfile = async (e) => {
  confirmDialog.show();

  const confirmAction = () => {
    internalPort.postMessage({
      type: 'delete-profile',
      data: {
        ...selectedIdentity,
      },
    });

    confirmDialog.close();
    profileEditDialog.close();
    document.getElementById('confirm-button').removeEventListener('click', confirmAction);
  };

  document.getElementById('confirm-button').addEventListener('click', confirmAction);

  e.preventDefault();
};

const generateColorSelection = () => {
  const colorSelection = document.getElementById('color-selection');

  avatarColors.forEach(({
    id: currentColorId,
    color: textColor,
    background,
  }) => {
    const color = document.createElement('span');
    color.classList.add('color');
    color.setAttribute('style', `background-color: ${background}; color: ${textColor}`);

    if (activeColor.id === currentColorId) {
      color.classList.add('selected');
    }

    color.addEventListener('click', ({ target: clickedColor }) => {
      activeColor = {
        color: textColor,
        background,
      };

      selectedIdentity.color = activeColor;

      // Remove selection for all other colors
      document.querySelectorAll('.color-selection .color').forEach((color) => {
        color.classList.remove('selected');
      });

      clickedColor.classList.add('selected');

      updateAvatar();
    });

    colorSelection.appendChild(color);
  });
};

const handleMessage = (message) => {
  if (!message.type) {
    console.error('Non-conformal message detected, omitting...');
    return;
  }

  if (message.type === 'all-identities-response') {
    availableIdentities = message.data;
    const list = document.getElementById('identity-list');
    const listAddButton = document.getElementById('add-identity-button');

    // Remove existing nodes
    const existingIdentities = document.querySelectorAll('.identity-box');
    existingIdentities.forEach((identityBox) => {
      list.removeChild(identityBox);
    });

    // From clean slate, create all identities
    availableIdentities.forEach((identity) => {
      const identityRow = createIdentityBox(identity);
      list.insertBefore(identityRow, listAddButton);
    });

    return;
  }
}

const createIdentityBox = (identity) => {
  const identityBox = document.createElement('li');
  identityBox.classList.add('identity-box');
  const avatar = document.createElement('span');
  avatar.classList.add('avatar');
  avatar.setAttribute('style', `background-color: ${identity.color.background}; color: ${identity.color.color}`);
  const displayName = document.createElement('span');

  avatar.innerHTML = identity.displayName.charAt(0);
  displayName.innerHTML = identity.displayName;

  identityBox.appendChild(avatar);
  identityBox.appendChild(displayName);

  identityBox.addEventListener('click', () => {
    selectedIdentity = identity;
    populateEditDialog();
    profileEditDialog.show();
  });

  return identityBox;
};

const populateEditDialog = () => {
  const displayNameInputField = document.getElementById('display-name');
  displayNameInputField.value = selectedIdentity.displayName;

  const idp = document.getElementById('idp');
  idp.value = selectedIdentity.idp;

  const webid = document.getElementById('webid');
  webid.value = selectedIdentity.webID;

  updateAvatarContent(selectedIdentity.displayName);
  setMutuallyExclusiveField();
  activeColor = selectedIdentity.color;
  updateAvatar();
};

const updateAvatar = () => {
  document.getElementById('avatar').setAttribute('style', `background-color: ${activeColor.background}; color: ${activeColor.color}`);
};

const updateAvatarContent = (value) => {
  if (!value.length) {
    avatar.innerHTML = '?';
    return;
  }

  avatar.innerHTML = value.trim().toUpperCase().charAt(0);
  selectedIdentity.displayName = value.trim();
};

const setMutuallyExclusiveField = () => {
  const webid = document.getElementById('webid');
  const idp = document.getElementById('idp');

  // Disable input for webID when filling in idp (mutually exclusive inputs)
  if (webid.value.length) {
    idp.setAttribute('disabled', true);
  } else {
    idp.removeAttribute('disabled');
  }

  if (idp.value.length) {
    webid.setAttribute('disabled', true);
  } else {
    webid.removeAttribute('disabled');
  }
};

const validateForm = () => {
  formErrors = [];

  if (!selectedIdentity.displayName.length) {
    formErrors = [
      ...formErrors,
      {
        id: 'display-name',
        error: 'You must provide a display name',
      },
    ];
  }

  if (!selectedIdentity.idp.length && !selectedIdentity.webID.length) {
    formErrors = [
      ...formErrors,
      {
        id: 'idp',
        error: 'Please provide either an Identity Provider or WebID',
      },
      {
        id: 'webid',
        error: 'Please provide either an Identity Provider or WebID',
      },
    ];
  }

  showErrors();

  if (formErrors.length) {
    return false;
  }

  return true;
};

const showErrors = () => {
  // Clear all errors first
  document.querySelectorAll('form input').forEach((inputField) => {
    inputField.classList.remove('error');
  });
  document.querySelectorAll('.error-explanation').forEach((errorExplanation) => {
    errorExplanation.innerHTML = '';
  });

  // Cycle through found errors and show it in the form
  formErrors.forEach(({
    id: elementId,
    error,
  }) => {
    document.getElementById(elementId).classList.add('error');
    document.getElementById(`${elementId}-error`).innerHTML = error;
  });
};

main();
