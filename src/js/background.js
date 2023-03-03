import {getAccessToken, getToken, getTokenUrl} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';

var id;
var secret;
var credentialsUrl;
var tokenUrl;

const isChrome = (navigator.userAgent.toLowerCase().includes("chrome"));

chrome.webNavigation.onCompleted.addListener(async function (details) {

})

async function rewriteRequestHeaders(details) {

    // TODO: find a more elegant way to catch the access token creation request called from getAccessToken()
    if (details.method === "POST") {
        return
    }

    if (id === undefined || secret === undefined || tokenUrl === undefined) {
        return
    }

    const {accessToken, dpopKey} = await getAccessToken(id, secret, tokenUrl);

    const dpopHeader = await createDpopHeader(details.url, "GET", dpopKey);

    details.requestHeaders.push({
        name: "authorization",
        value: "DPoP " + accessToken
    })

    details.requestHeaders.push({
        name: "dpop",
        value: dpopHeader
    })

    return {requestHeaders: details.requestHeaders}
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteRequestHeaders,
    {
        urls: ["<all_urls>"]
    },
    ["blocking", "requestHeaders"]
)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse);
    return true;
});

async function handleMessage(message) {
    if (message.msg === "generate-id") {

        credentialsUrl = message.idp + "idp/credentials/";

        tokenUrl = await getTokenUrl(message.idp);

        const response = await getToken(message.email, message.password, credentialsUrl);
        id = response.id;
        secret = response.secret;

        let success = (id !== undefined && secret !== undefined);
        changeIcon(success);

        return {
            success: success
        };
    } else if (message.msg === "logout") {
        changeIcon(false);
        id = undefined;
        secret = undefined;
        tokenUrl = undefined;
    } else if (message.msg === "check-authenticated") {
        let authenticated = (id !== undefined && secret !== undefined && tokenUrl !== undefined);
        return {
            authenticated: authenticated
        };
    }
}

function changeIcon(success) {
    const iconPath = success ? "solid-48-checkmark.png" : "solid-48.png";
    chrome.browserAction.setIcon({
        path: {
            "48": iconPath
        }
    });
}

function loadFromBrowserStorage(item, callback) {
    chrome.storage.local.get(item, callback);
}

function storeInBrowserStorage(item, callback) {
    chrome.storage.local.set(item, callback);
}

storeInBrowserStorage({solidAuthentication: "test"}, function () {
    return
})


