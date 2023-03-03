
const $loginbutton = document.getElementById('generate-button');
$loginbutton.addEventListener('click', handleOnClickLogin);

async function handleOnClickLogin(){
    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("button-text").classList.add('hidden');

    let email = document.getElementById("email-input-form").value
    let password = document.getElementById("password-input-form").value
    let idp  = document.getElementById("idp-input-form").value

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

function handleAfterLogin(success){
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("credential-input-forms").classList.add('hidden');
        document.getElementById("login-status-success").classList.remove('hidden');
        document.getElementById("login-status-fail").classList.add('hidden');
    } else {
        document.getElementById("login-status-fail").classList.remove('hidden');
        document.getElementById("login-status-success").classList.add('hidden');
    }
}
