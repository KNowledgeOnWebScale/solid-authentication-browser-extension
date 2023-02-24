
const $generate = document.getElementById('generate-button');
$generate.addEventListener('click', async () => {

    document.getElementById("loader").classList.remove('hidden');
    document.getElementById("button-text").classList.add('hidden');

    const email = document.getElementById("email-input-form").value
    const password = document.getElementById("password-input-form").value
    let domain  = document.getElementById("domain-input-form").value

    if (!domain.endsWith("/")) {
        domain = domain + "/"
    }

    chrome.runtime.sendMessage({
        message: "generate-id",
        email,
        password,
        domain,
    }, handleAfterLogin);
})

function handleAfterLogin(success){
    document.getElementById("loader").classList.add('hidden');
    document.getElementById("button-text").classList.remove('hidden');
}
