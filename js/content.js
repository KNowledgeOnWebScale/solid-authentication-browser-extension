import {getAccessToken, makeAuthenticadedRequest} from "./solid";

var access_token;

chrome.webNavigation.onCompleted.addListener(async function (details) {

    if (details.statusCode === 401) {

        const response = await makeAuthenticadedRequest(details.url, access_token);

        if (response.status === 401) {
            // TODO: Handle expired access token or invalid user id/secret
            return;
        }

        const html = await response.text();

        chrome.tabs.executeScript({
            code: `document.body.innerHTML = ${JSON.stringify(html)}`
        });
    }
});

chrome.runtime.onMessage.addListener(function request(msg, sender, sendResponse) {
    if (msg.text === 'create-access-token') {
        access_token = getAccessToken(
            msg.id,
            msg.secret
        )
        if (access_token === undefined) {
            sendResponse({
                text: 'unauthorized'
            });
        }
    }
});

