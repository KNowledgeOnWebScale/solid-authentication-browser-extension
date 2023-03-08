function main() {

    const $loginbutton = document.getElementById('generate-button');
    $loginbutton.addEventListener('click', handleOnClickLogin);
    $loginbutton.addEventListener('keypress', submitLoginOnKeyEnter)

    const $logoutbutton = document.getElementById('logout-button');
    $logoutbutton.addEventListener('click', handleOnClickLogout);

    document.getElementById("email-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("password-input-form").addEventListener("keypress", submitLoginOnKeyEnter);
    document.getElementById("idp-input-form").addEventListener("keypress", submitLoginOnKeyEnter);

    chrome.runtime.sendMessage({
        msg: "check-authenticated"}, function(response) {
        if (response.authenticated) {
            console.log(response);
            handleAfterLogin(true);
        }
    });
}

function submitLoginOnKeyEnter(event) {
    if (event.key === "Enter") {
        handleOnClickLogin()
    }
}

async function handleOnClickLogin(){
    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("generate-button-text").classList.add('hidden');

    let email = document.getElementById("email-input-form").value
    let password = document.getElementById("password-input-form").value
    let idp  = document.getElementById("idp-input-form").value

    if (email === '' && password === '' && idp === '') {
        email = "***REMOVED***"
        password = "***REMOVED***"
        idp = "https://pod.playground.solidlab.be/"
    }

    if (!idp.endsWith("/")) {
        idp = idp + "/"
    }

    chrome.runtime.sendMessage({
        msg: "generate-id",
        email,
        password,
        idp,}, function(response) {
        handleAfterLogin(response.success)
    });
}

function handleOnClickLogout() {
    chrome.runtime.sendMessage({
        msg: "logout"
    })

    document.getElementById("generate-button").classList.remove("d-none");
    document.getElementById('logout-button').classList.add("d-none");
    document.getElementById("credential-input-forms").classList.remove('hidden');
    document.getElementById("login-status-success").classList.add('hidden');

    document.getElementById("email-input-form").value = '';
    document.getElementById('password-input-form').value = '';
    document.getElementById('idp-input-form').value = '';
}

function handleAfterLogin(success){
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("generate-button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("credential-input-forms").classList.add('hidden');
        document.getElementById("login-status-success").classList.remove('hidden');
        document.getElementById("login-status-fail").classList.add('hidden');
        document.getElementById("generate-button").classList.add("d-none");
        document.getElementById('logout-button').classList.remove("d-none");
    } else {
        document.getElementById("login-status-fail").classList.remove('hidden');
        document.getElementById("login-status-success").classList.add('hidden');
    }
}

main();
