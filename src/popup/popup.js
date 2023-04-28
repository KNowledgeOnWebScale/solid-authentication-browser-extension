let enableRegex;

function main() {

    const $loginbutton = document.getElementById('login-button');
    $loginbutton.addEventListener('click', handleOnClickLogin);
    $loginbutton.addEventListener('keypress', submitLoginOnKeyEnter)

    const $logoutbutton = document.getElementById('logout-button');
    $logoutbutton.addEventListener('click', handleOnClickLogout);

    const $updatebutton = document.getElementById("update-filter-button");
    $updatebutton.addEventListener('click', handleOnClickUpdateFilter);

    document.getElementById("email-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("password-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("idp-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("domain-input-form").addEventListener("keypress", submitLoginOnKeyEnter);

    document.getElementById("enable-regex-button").addEventListener('click', handleOnClickRegex)

    enableRegex = false;

    chrome.runtime.sendMessage({
        msg: "check-authenticated"
    }, function (response) {
        if (response.authenticated) {
            handleAfterLoginAttempt({
                success: true,
                error: undefined
            });
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
    document.getElementById("login-loader").classList.remove('hidden');
    document.getElementById("generate-button-text").classList.add('hidden');
    document.getElementById("login-status-fail").classList.add('hidden');

    let email = document.getElementById("email-input-form").value
    let password = document.getElementById("password-input-form").value
    let idp = document.getElementById("idp-input-form").value
    let filter = document.getElementById("domain-input-form").value

    if (!idp.endsWith("/")) {
        idp = idp + "/"
    }

    chrome.runtime.sendMessage({
        msg: "generate-id",
        email,
        password,
        idp,
        filter,
        regex: enableRegex
    }, function (response) {
        handleAfterLoginAttempt(response)
    });
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
    document.getElementById("update-filter-button").classList.add("d-none");
    document.getElementById("login-status-success").classList.add('hidden');

    document.getElementById("email-input-div").classList.remove('hidden');
    document.getElementById("password-input-div").classList.remove('hidden');
    document.getElementById("idp-input-div").classList.remove('hidden');

    document.getElementById("email-input-form").value = '';
    document.getElementById('password-input-form').value = '';
    document.getElementById('idp-input-form').value = '';
    document.getElementById('domain-input-form').value = '';
}

/**
 * Handle user's request to update domain filter
 */
function handleOnClickUpdateFilter() {
    document.getElementById("update-loader").classList.remove('hidden');
    document.getElementById("update-button-text").classList.add('hidden');
    let filter = document.getElementById("domain-input-form").value
    chrome.runtime.sendMessage({
        msg: "update-filter",
        filter,
        regex: enableRegex
    }, function () {
        document.getElementById("update-loader").classList.add('hidden');
        document.getElementById("update-button-text").classList.remove('hidden');
    });
}

/**
 * Callback of attempted login in background process script
 * @param {success:Boolean, error: Error} options - The result of the login attempt
 */
function handleAfterLoginAttempt(options) {
    const {success, error} = options;

    document.getElementById("login-loader").classList.add('hidden');
    document.getElementById("generate-button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("email-input-div").classList.add('hidden');
        document.getElementById("password-input-div").classList.add('hidden');
        document.getElementById("idp-input-div").classList.add('hidden');

        document.getElementById("login-status-success").classList.remove('hidden');
        document.getElementById("login-status-fail").classList.add('hidden');
        document.getElementById("login-button").classList.add("d-none");
        document.getElementById('logout-button').classList.remove("d-none");
        document.getElementById("update-filter-button").classList.remove("d-none");

        chrome.runtime.sendMessage({
            msg: "get-filter"
        }, function (response) {
            document.getElementById("domain-input-form").value = response.domainFilter;
            const $regexButton = document.getElementById("enable-regex-button")

            enableRegex = response.enableRegex

            if (response.enableRegex) {
                $regexButton.classList.add("active");
            } else {
                $regexButton.classList.remove("active");
            }
        });
    } else {
        document.getElementById('login-fail-error').innerText = error + '.';
        document.getElementById("login-status-fail").classList.remove('hidden');
        document.getElementById("login-status-success").classList.add('hidden');
    }
}

/**
 * Handle user's request to enable or disable regex syntax on domain filter
 */
function handleOnClickRegex() {
    const $regexButton = document.getElementById("enable-regex-button")
    if (enableRegex) {
        $regexButton.classList.remove("active");
    } else {
        $regexButton.classList.add("active");
    }
    enableRegex = !enableRegex;
}

main();
