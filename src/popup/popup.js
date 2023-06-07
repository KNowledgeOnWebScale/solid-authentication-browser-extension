const QueryEngine = require('@comunica/query-sparql').QueryEngine;

let loginMethod = 'oidc' // or 'client-credentials'
let idpOrWebID = 'idp'; // or 'webid';

function main() {
    const $loginbutton = document.getElementById('login-button');
    $loginbutton.addEventListener('click', handleOnClickLogin);
    $loginbutton.addEventListener('keypress', submitLoginOnKeyEnter)

    const $logoutbutton = document.getElementById('logout-button');
    $logoutbutton.addEventListener('click', handleOnClickLogout);
    document.getElementById('use-client-credentials-button')
      .addEventListener('click', showClientCredentialFields);
    document.getElementById('use-oidc-button')
      .addEventListener('click', showOIDCFields);

    // const $updatebutton = document.getElementById("update-filter-button");
    // $updatebutton.addEventListener('click', handleOnClickUpdateFilter);

    document.getElementById("email-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("password-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("idp-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("webid-input-form").addEventListener("keypress", submitLoginOnKeyEnter);

    // IDP WebID switch
    const radios = document.querySelectorAll('input[type=radio][name="idp-webid-switch"]');
    radios.forEach(radio => radio.addEventListener('change', () => handleSwitch(radio.value)));

    const $showHistoryButton = document.getElementById('show-history-button');
    $showHistoryButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            msg: "show-history"
        });
    });

    chrome.runtime.sendMessage({
        msg: "check-authenticated"
    }, function (response) {
        if (response.authenticated) {
            console.log(response);
            handleAfterLogin(true, response.name);
        } else if (response.latestIDP) {
            document.getElementById('idp-input-form').value = response.latestIDP;

            if (response.latestWebID) {
                document.getElementById('webid-input-form').value = response.latestWebID;
            }
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
    document.getElementById("idp-tab-message").classList.remove('hidden');
    document.getElementById("generate-button-text").classList.add('hidden');

    let idp;
    let webId;

    if (idpOrWebID === 'webid') {
        webId = document.getElementById("webid-input-form").value;
        const idps = await getIDPsFromWebID(webId);
        if (idps.length === 0) {
            console.error('No IDP found in WebID.');
            // TODO show error;
            return
        }

        if (idps.length === 1) {
            idp = idps[0];
            console.debug('Only 1 IDP found in WebID:', idp);
        } else {
            // More than 1 IDP.
            // TODO: Ask user to select one.
            // At the moment we take the first one.
            idp = idps[0];
            console.warm('More than 1 IDP found in WebID. Using ', idp);
        }
    } else {
        idp = document.getElementById("idp-input-form").value;
    }

    if (!idp.startsWith("https://") || idp.startsWith("http://")) {
        idp = `https://${idp}`;
    }

    if (!idp.endsWith("/")) {
        idp = `${idp}/`;
    }

    if (loginMethod === 'oidc') {
        oidcLogin(idp, webId);
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
    }, response => {
        document.getElementById('idp-input-form').value = response.latestIDP;

        if (response.latestWebID) {
            document.getElementById('webid-input-form').value = response.latestWebID;
        }
    });

    document.getElementById("login-button").classList.remove("d-none");
    document.getElementById('logout-button-div').classList.add("d-none");
    document.getElementById("update-filter-button").classList.add("d-none");
    document.getElementById("login-status-success").classList.add('hidden');
    document.getElementById("name").classList.add('hidden');
    document.getElementById("use-client-credentials").classList.remove('hidden');
    document.getElementById("use-client-credentials").classList.remove('d-none');

    document.getElementById("email-input-div").classList.remove('hidden');
    document.getElementById("password-input-div").classList.remove('hidden');
    document.getElementById("idp-input-div").classList.remove('hidden');

    document.getElementById("email-input-form").value = '';
    document.getElementById('password-input-form').value = '';
    document.getElementById('idp-input-form').value = '';
    document.getElementById('idp-webid-switch').classList.remove("hidden");
}

/**
 * Handle user's request to update domain filter
 */
// function handleOnClickUpdateFilter() {
//     document.getElementById("update-loader").classList.remove('hidden');
//     document.getElementById("update-button-text").classList.add('hidden');
//     let filter = document.getElementById("domain-input-form").value
//     chrome.runtime.sendMessage({
//         msg: "update-filter",
//         filter,
//         regex: enableRegex
//     }, function () {
//         document.getElementById("update-loader").classList.add('hidden');
//         document.getElementById("update-button-text").classList.remove('hidden');
//     });
// }

/**
 * Callback of attempted login in background process script
 * @param {success:Boolean, error: Error} options - The result of the login attempt
 */
function handleAfterLogin(success, name) {
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("idp-tab-message").classList.add('hidden');
    document.getElementById("generate-button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("credential-input-forms").classList.add('hidden');
        document.getElementById("use-client-credentials").classList.add('hidden');
        document.getElementById("use-client-credentials").classList.add("d-none");
        document.getElementById("login-status-success").classList.remove('hidden');
        document.getElementById("login-status-fail").classList.add('hidden');
        document.getElementById("login-button").classList.add("d-none");
        document.getElementById('logout-button').classList.remove("d-none");
        document.getElementById('idp-webid-switch').classList.add("hidden");
        if (name) {
            document.getElementById("name").classList.remove('hidden');
            document.getElementById("name").innerText = 'as ' + name;
        }
    } else {
        document.getElementById('login-fail-error').innerText = error + '.';
        document.getElementById("login-status-fail").classList.remove('hidden');
        document.getElementById("use-client-credentials").classList.remove('hidden');
        document.getElementById("use-client-credentials").classList.remove("d-none");
        document.getElementById("login-status-success").classList.add('hidden');
        document.getElementById("name").classList.add('hidden');
        document.getElementById('idp-webid-switch"').classList.remove("hidden");
    }
}

function showClientCredentialFields() {
    loginMethod = 'client-credentials';
    document.getElementById("email-container").classList.remove('hidden');
    document.getElementById("password-container").classList.remove('hidden');
    document.getElementById("use-oidc").classList.remove('hidden');
    document.getElementById("use-oidc").classList.add('d-flex');
    document.getElementById("use-client-credentials").classList.add('hidden');
    document.getElementById("use-client-credentials").classList.remove('d-flex');
    document.getElementById('idp-webid-switch"').classList.remove("hidden");
}

function showOIDCFields() {
    loginMethod = 'oidc';
    document.getElementById("email-container").classList.add('hidden');
    document.getElementById("password-container").classList.add('hidden');
    document.getElementById("use-oidc").classList.add('hidden');
    document.getElementById("use-oidc").classList.remove('d-flex');
    document.getElementById("use-client-credentials").classList.remove('hidden');
    document.getElementById("use-client-credentials").classList.add('d-flex');
    document.getElementById('idp-webid-switch"').classList.remove("hidden");
}

async function oidcLogin(oidcIssuer, webId) {
    if (!oidcIssuer) {
        return;
    }

    await chrome.runtime.sendMessage({
        msg: "login-with-oidc",
        oidcIssuer,
        webId
    });
}

function handleSwitch(currentValue) {
    idpOrWebID = currentValue;
    console.log(currentValue);

    if (currentValue === 'idp') {
        console.log(currentValue);
        document.getElementById('idp-container').classList.remove('hidden');
        document.getElementById('webid-container').classList.add('hidden');
    } else if (currentValue === 'webid') {
        document.getElementById('idp-container').classList.add('hidden');
        document.getElementById('webid-container').classList.remove('hidden');
    }
}

async function getIDPsFromWebID(webId) {
    const myEngine = new QueryEngine();
    const bindingsStream = await myEngine.queryBindings(`
  SELECT ?idp WHERE {
    <${webId}> <http://www.w3.org/ns/solid/terms#oidcIssuer> ?idp
  } LIMIT 10`, {
        sources: [webId],
    });

    const bindings = await bindingsStream.toArray();
    return bindings.map(a => a.get('idp').value);
}

main();
