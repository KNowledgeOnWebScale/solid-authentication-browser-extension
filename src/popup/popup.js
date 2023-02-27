
const $loginbutton = document.getElementById('generate-button');
$loginbutton.addEventListener('click', handleOnClickLogin);

async function handleOnClickLogin(){
    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("button-text").classList.add('hidden');

    const email = document.getElementById("email-input-form").value
    const password = document.getElementById("password-input-form").value
    let idp  = document.getElementById("idp-input-form").value

    if (!idp.endsWith("/")) {
        idp = idp + "/"
    }

    chrome.runtime.sendMessage({
        message: "generate-id",
        email,
        password,
        idp,}, handleAfterLogin);
}

function handleAfterLogin(success){
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("button-text").classList.remove('hidden');

    if (success) {
        document.getElementById("credential-input-forms").classList.add('hidden');
        document.getElementById("login-status").classList.remove('hidden');
    }
}
