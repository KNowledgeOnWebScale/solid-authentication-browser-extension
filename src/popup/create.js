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

const main = () => {
  const avatar = document.getElementById('avatar');

  generateColorSelection();
  updateAvatar();

  document.getElementById('display-name').addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    if (!value.length) {
      avatar.innerHTML = '?';
    }

    avatar.innerHTML = value[0];
    displayName = value.trim();
  });

  document.getElementById('idp').addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    idp = value;
  });

  document.getElementById('webid').addEventListener('input', ({
    target: {
      value,
    }
  }) => {
    webID = value;
  });

  document.getElementById('create-button').addEventListener('click', () => {

  });
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

const updateAvatar = () => {
  document.getElementById('avatar').setAttribute('style', `background-color: ${activeColor.background}; color: ${activeColor.color}`);
};

main();
