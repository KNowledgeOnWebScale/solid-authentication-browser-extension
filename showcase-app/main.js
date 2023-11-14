import {
  fetch,
  login,
  getDefaultSession,
  handleIncomingRedirect,
} from '@inrupt/solid-client-authn-browser';
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
} from '@inrupt/solid-client';
import { SCHEMA_INRUPT } from '@inrupt/vocab-common-rdf';
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
        <img src="/solid-48.png" alt="solid logo"/>
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
 * Application-side code for demonstration purposes.
 */
const main = async () => {
  // Create new link to Chrome extension and link callback to detect changes in identity:
  identityWidget = new IdentityWidget();
  identityWidget.onIdentityChanged(handleIdentityChange);

  // Restore session if available:
  await handleIncomingRedirect({ restorePreviousSession: true });

  // You can get a list of all identities currently available from the chrome extension:
  // const identities = await identityWidget.getIdentities();

  await updateState();
};

// Invalidates the application - purely checks whether logged in or not and updates app state based on that
const updateState = async () => {
  if (getDefaultSession().info.isLoggedIn) {
    console.log(
      '%cLOGGED IN',
      'padding: 5px; border-radius: 3px; background: #e3c; font-weight: bold; color: white',
      getDefaultSession().info,
    );
    document.getElementById('app-card').classList.remove('hidden');
    document.getElementById('login-card').classList.add('hidden');

    const session = getDefaultSession();

    // Getting dataset from a specific WebID (the one that was logged in with)
    const myDataset = await getSolidDataset(session.info.webId, { fetch });

    // Getting contents at /me from the current pod
    const me = getThing(myDataset, session.info.webId);

    // Getting the name from the vcard if exists
    const name = getStringNoLocale(me, SCHEMA_INRUPT.name);

    // By means of an example, we forward the metadata from the pod to the extension using metadata and an update event
    identityWidget.updateProfile({
      ...identityWidget.activeIdentity,
      metadata: {
        name, // The name is also a property used by the extension to show more specific data once a user has finally logged in
      },
    });
  } else {
    document.getElementById('app-card').classList.add('hidden');
    document.getElementById('login-card').classList.remove('hidden');
  }
};

/**
 * This function is called whenever the identity changes.
 * @param {object} newIdentity - The new identity that is active.
 * @param {string} newIdentity.displayName - The identity's display name.
 */
const handleIdentityChange = async (newIdentity) => {
  // Check if data is populated, and handle it if it is.
  if (!newIdentity) {
    document.getElementById('one-click-login').classList.add('hidden');
    return;
  }

  // If you are already logged in, changing identity should also change session.
  if (getDefaultSession().info.isLoggedIn) {
    await logout();
    window.location.href = window.location.origin;
  }

  // Show the user the option to log in with this new active identity.
  document.getElementById('one-click-login').classList.remove('hidden');
  document.getElementById(
    'login-with-extension-text',
  ).innerHTML = `Continue as ${newIdentity.displayName}`;
};

/**
 * Starts the login process if not already logged in.
 * @returns {Promise<void>}
 */
const startLogin = async () => {
  if (!getDefaultSession().info.isLoggedIn) {
    await login({
      oidcIssuer: identityWidget.activeIdentity.idpOrWebID,
      redirectUrl: window.location.href,
      clientName: 'Cool Solid App (showcase)',
    });
  }
};

/**
 * Logs out of the current session.
 * @returns {Promise<void>}
 */
const logout = async () => {
  await getDefaultSession().logout();
  await updateState();
};

document
  .getElementById('login-with-extension')
  .addEventListener('click', async (e) => {
    e.preventDefault();
    await startLogin();
  });

document
  .getElementById('logout-button')
  .addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
  });

main();
