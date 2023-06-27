const main = () => {
  document.getElementById('add-identity-button').addEventListener('click', () => {
    createNewIdentity();
  });
}

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
}

main();
