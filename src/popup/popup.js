import {Session} from '@inrupt/solid-client-authn-browser';
import {PopupStorage} from "../js/popup-storage";

function main() {

    const $loginbutton = document.getElementById('login-button');
    $loginbutton.addEventListener('click', handleOnClickLogin);
    $loginbutton.addEventListener('keypress', submitLoginOnKeyEnter)

    const $logoutbutton = document.getElementById('logout-button');
    $logoutbutton.addEventListener('click', handleOnClickLogout);

    document.getElementById("email-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("password-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("idp-input-form").addEventListener("keypress", submitLoginOnKeyEnter);

    chrome.runtime.sendMessage({
        msg: "check-authenticated"
    }, function (response) {
        if (response.authenticated) {
            console.log(response);
            handleAfterLogin(true);
        }
    });
}

/**
 * Function called by various keypress listeners that will trigger a log in event if the "Enter" key was pressed
 * @param {Event} event - Keypress event
 */
function submitLoginOnKeyEnter(event) {
    if (event.key === "Enter") {
        handleOnClickLogin()
    }
}

/**
 * Handle user's request to log in
 */
async function handleOnClickLogin() {
    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("generate-button-text").classList.add('hidden');

    let email = document.getElementById("email-input-form").value
    let password = document.getElementById("password-input-form").value
    let idp = document.getElementById("idp-input-form").value

    if (!idp.endsWith("/")) {
        idp = idp + "/"
    }

    const result = await oidcLogin(idp);
    console.log(result);
    //
    // chrome.runtime.sendMessage({
    //     msg: "generate-id",
    //     email,
    //     password,
    //     idp,
    // }, function (response) {
    //     handleAfterLogin(response.success)
    // });
}

/**
 * Handle user's request to log out
 */
function handleOnClickLogout() {
    chrome.runtime.sendMessage({
        msg: "logout"
    })

    document.getElementById("login-button").classList.remove("d-none");
    document.getElementById('logout-button').classList.add("d-none");
    document.getElementById("credential-input-forms").classList.remove('hidden');
    document.getElementById("login-status-success").classList.add('hidden');

    document.getElementById("email-input-form").value = '';
    document.getElementById('password-input-form').value = '';
    document.getElementById('idp-input-form').value = '';
}

/**
 * Callback of attempted login in background process script
 * @param {Boolean} success - Boolean value indicated if the log in attempt was successful
 */
function handleAfterLogin(success) {
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("generate-button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("credential-input-forms").classList.add('hidden');
        document.getElementById("login-status-success").classList.remove('hidden');
        document.getElementById("login-status-fail").classList.add('hidden');
        document.getElementById("login-button").classList.add("d-none");
        document.getElementById('logout-button').classList.remove("d-none");
    } else {
        document.getElementById("login-status-fail").classList.remove('hidden');
        document.getElementById("login-status-success").classList.add('hidden');
    }
}

async function oidcLogin(oidcIssuer) {
    if (!oidcIssuer) {
        return;
    }
    const storage = new PopupStorage();
    const session = new Session({
        secureStorage: storage,
        insecureStorage: storage
    });

    chrome.runtime.sendMessage({
        msg: "store-session-id",
        id: session.info.sessionId,
    });

    await session.login({
        // Specify the URL of the user's Solid Identity Provider;
        // e.g., "https://login.inrupt.com".
        oidcIssuer,
        // Specify the URL the Solid Identity Provider should redirect the user once logged in,
        // e.g., the current page for a single-page app.
        redirectUrl: 'https://whateveryouwant-solid.com/',
        // Provide a name for the application when sending to the Solid Identity Provider
        clientName: "My application"
    });
}

main();
