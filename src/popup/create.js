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

let displayName = '';
let webID = '';
let idp = '';
let activeColor = avatarColors[0];
let internalPort;

let formErrors = [];

const main = () => {
  internalPort = chrome.runtime.connect({ name: 'create' });
  const avatar = document.getElementById('avatar');
  const displayNameInputField = document.getElementById('display-name');
  const idpInputField = document.getElementById('idp');
  const webIdInputField = document.getElementById('webid');

  generateColorSelection();
  updateAvatar();

  displayNameInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    if (!value.length) {
      avatar.innerHTML = '?';
      return;
    }

    avatar.innerHTML = value.trim().toUpperCase().charAt(0);
    displayName = value.trim();
  });

  idpInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    idp = value;

    // Disable input for webID when filling in idp (mutually exclusive inputs)
    if (value.length) {
      webIdInputField.setAttribute('disabled', true);
    } else {
      webIdInputField.removeAttribute('disabled');
    }
  });

  webIdInputField.addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    webID = value;

    // Disable input for webID when filling in idp (mutually exclusive inputs)
    if (value.length) {
      idpInputField.setAttribute('disabled', true);
    } else {
      idpInputField.removeAttribute('disabled');
    }
  });

  document.getElementById('create-button').addEventListener('click', submitForm);
};

const submitForm = (e) => {
  if (validateForm()) {
    internalPort.postMessage({
      type: 'create-profile',
      data: {
        idp,
        webID,
        displayName,
        color: activeColor,
      },
    });
    window.close();
  }

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

const validateForm = () => {
  formErrors = [];

  if (!displayName.length) {
    formErrors = [
      ...formErrors,
      {
        id: 'display-name',
        error: 'You must provide a display name',
      },
    ];
  }

  if (!idp.length && !webID.length) {
    formErrors = [
      ...formErrors,
      {
        id: 'idp',
        error: 'Please provide an Identity Provider or WebID',
      },
      {
        id: 'webid',
        error: 'Please provide an Identity Provider or WebID',
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

const updateAvatar = () => {
  document.getElementById('avatar').setAttribute('style', `background-color: ${activeColor.background}; color: ${activeColor.color}`);
};

main();
