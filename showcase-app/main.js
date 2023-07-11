import { login, getDefaultSession, handleIncomingRedirect } from '@inrupt/solid-client-authn-browser';
import IdentityWidget from './plugin/identityPlugin';

import './reset.css';
import './style.css';

document.querySelector('#app').innerHTML = `
  <div id="login-card" class="card hidden">
    <h1 class="product-title">Cool<br />Solid<br />App</h1>
    <h2>Log in with your Solid Identity</h2>
    <form>
      <fieldset>
        <label>Identity</label>
        <input type="text" placeholder="WebID or IDP (INOP)" />
      </fieldset>
      <button>Log in</button>
    </form>
    <section id="one-click-login" class="hidden">
      <hr />
      <button class="oidc-login-button" id="login-with-extension">
        <img src="solid-48.png" />
        <span id="login-with-extension-text"></span>
      </button>
    </section>
  </div>

  <div id="app-card" class="card hidden">
    <h2>Logged in!</h2>
    <p>You're now logged in!</p>

    <button id="logout-button">Log out</button>
  </div>
`;

let identityWidget;

/**
 * Application-side code for demonstration purposes
 */
const main = async () => {
  identityWidget = new IdentityWidget();
  identityWidget.onIdentityChanged(handleIdentityChange);

  await handleIncomingRedirect({ restorePreviousSession: true });

  const identities = await identityWidget.getIdentities();

  updateState();
};

const updateState = () => {
  if (getDefaultSession().info.isLoggedIn) {
    console.log('%cLOGGED IN', 'padding: 5px; border-radius: 3px; background: #e3c; font-weight: bold; color: white', getDefaultSession().info);
    document.getElementById('app-card').classList.remove('hidden');
    document.getElementById('login-card').classList.add('hidden');
  } else {
    document.getElementById('app-card').classList.add('hidden');
    document.getElementById('login-card').classList.remove('hidden');
  }
};

const handleIdentityChange = (newIdentity) => {
  // Check if data is populated, and handle it if it is
  if (!newIdentity) {
    document.getElementById('one-click-login').classList.add('hidden');
    return;
  }

  // If you are already logged in, changing identity should also change session
  if (getDefaultSession().info.isLoggedIn) {
    logout();
    window.location.href = window.location.origin;
  }

  // Show the user the option to log in with this new active identity
  document.getElementById('one-click-login').classList.remove('hidden');
  document.getElementById('login-with-extension-text').innerHTML = `Continue as ${newIdentity.displayName}`;

  return;
};

const startLogin = async () => {
  // Start the Login Process if not already logged in.
  if (!getDefaultSession().info.isLoggedIn) {
    await login({
      oidcIssuer: identityWidget.activeIdentity.idpOrWebID,
      redirectUrl: window.location.href,
      clientName: 'Cool Solid App (showcase)'
    });
  }
};

const logout = async () => {
  await getDefaultSession().logout();
  updateState();
};

document.getElementById('login-with-extension').addEventListener('click', (e) => {
  e.preventDefault();
  startLogin();
});

document.getElementById('logout-button').addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

main();
