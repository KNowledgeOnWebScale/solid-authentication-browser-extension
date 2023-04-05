let loginMethod = 'oidc' // or 'client-credentials'

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


    let idp = document.getElementById("idp-input-form").value
    if (!idp.endsWith("/")) {
        idp = idp + "/"
    }

    if (loginMethod === 'oidc') {
        oidcLogin(idp);
    } else {
        let email = document.getElementById("email-input-form").value
        let password = document.getElementById("password-input-form").value

        chrome.runtime.sendMessage({
            msg: "login-with-client-credentials",
            email,
            password,
            idp,
        }, function (response) {
            handleAfterLogin(response.success)
        });
    }
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

    await chrome.runtime.sendMessage({
        msg: "login-with-oidc",
        oidcIssuer
    });
}

main();
