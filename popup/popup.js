import {getToken} from '../js/solid.js';

const executing = browser.tabs.executeScript({file: "../js/content.js"})
executing.then(await main());

async function main() {

    let {id, secret} = await browser.storage.local.get(["solid-client-authn-id", "solid-client-authn-secret"]);

    if (id !== undefined && secret !== undefined) {
        document.getElementById("id-input-form").value = id;
        document.getElementById("secret-input-form").value = secret;
    }

    const $generate = document.getElementById('generate-button');
    $generate.addEventListener('click', async () => {

        // TODO: this call to getToken should be a runtime message call to a background script/process
        let {id, secret} = getToken(
            document.getElementById("email-input-form").value,
            document.getElementById("password-input-form").value
        )
        document.getElementById("id-input-form").setAttribute('placeholder', id);
        document.getElementById("secret-input-form").setAttribute('placeholder', secret);
    })

    const $authenticate = document.getElementById('authenticate-button');
    $authenticate.addEventListener('click', async () => {
        document.getElementById("loader").classList.remove('hidden');
        let id = document.getElementById("id-input-form").value;
        let secret = document.getElementById("secret-input-form").value;
        const response = chrome.runtime.sendMessage({
            message: 'create-access-token',
            id: id,
            secret: secret
        })

        document.getElementById("loader").classList.add('hidden');

        if (response.value === "unauthorized") {
            document.getElementById("loader").classList.remove('hidden');
        } else {
            browser.storage.local.set({"solid-client-authn-id": id});
            browser.storage.local.set({"solid-client-authn-secret": secret});
        }
    })
}