import {getAccessToken, getToken, getTokenUrl} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';

var id;
var secret;
var tokenUrl;

var isChrome;

function onStartup() {

    isChrome = (navigator.userAgent.toLowerCase().includes("chrome"));

    getCredentialsFromBrowserStorage();

    chrome.webNavigation.onCompleted.addListener(async function (details) {

    })
}

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

        let credentialsUrl = message.idp + "idp/credentials/";
        tokenUrl = await getTokenUrl(message.idp);

        const response = await getToken(message.email, message.password, credentialsUrl);
        id = response.id;
        secret = response.secret;

        let success = (id !== undefined && secret !== undefined);
        changeIcon(success);

        if (success) {
            storeCredentialsInBrowserStorage(id, secret, tokenUrl);
        }

        return {
            success: success
        };

    } else if (message.msg === "logout") {

        id = undefined;
        secret = undefined;
        tokenUrl = undefined;

        changeIcon(false);
        removeClientCredentialsFromBrowserStorage();

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

function getCredentialsFromBrowserStorage() {
    loadFromBrowserStorage(["solidCredentials"], function (result) {
        if (result.solidCredentials !== undefined) {
            id = result.solidCredentials.id
            secret = result.solidCredentials.secret
            tokenUrl = result.solidCredentials.tokenUrl
            changeIcon(true);
        } else {
            changeIcon(false);
        }
    })
}

function storeCredentialsInBrowserStorage(id, secret, tokenUrl) {
    storeInBrowserStorage({
        solidCredentials: {
            id: id,
            secret: secret,
            tokenUrl: tokenUrl
        }
    })
}

function removeClientCredentialsFromBrowserStorage() {
    removeFromBrowserStorage("solidCredentials");
}

function loadFromBrowserStorage(item, callback) {
    chrome.storage.local.get(item, callback);
}

function storeInBrowserStorage(item, callback) {
    chrome.storage.local.set(item, callback);
}

function removeFromBrowserStorage(item, callback) {
    chrome.storage.local.remove(item, callback);
}

onStartup();
