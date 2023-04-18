window.onload = () => {
  setInterval(updateValues, 200);
}

function updateValues() {
  if (!window.solid) {
    console.error('window.solid is undefined.');
    document.getElementById('error').classList.remove('hidden');
    return;
  }

  document.getElementById('error').classList.add('hidden');

  window.solid.getStatus(status => {
    let local = JSON.parse(status);
    console.log(local);
    document.getElementById('logged-in').innerText = local.authenticated;
    document.getElementById('webId').innerText = local.webId;
  });
}
