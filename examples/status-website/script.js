window.onload = () => {
  if (!window.solid) {
    console.error('window.solid is undefined.');
    document.getElementById('error').classList.remove('hidden');
    return;
  }

  window.solid.onStatusChange(status => {
    console.log(status);
    updateHTML(JSON.parse(status));
  });

  updateValues(); //To set initial state.
}

function updateValues() {
  window.solid.getStatus(status => {
    let local = JSON.parse(status);
    console.log(local);
    updateHTML(local);
  });
}

function updateHTML(status) {
  console.log(status);
  document.getElementById('logged-in').innerText = status.authenticated;
  document.getElementById('webId').innerText = status.webId;
}
