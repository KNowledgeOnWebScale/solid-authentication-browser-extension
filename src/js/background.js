import {getAccessToken, getToken, getTokenUrl, sendHead} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';
// import {buildAuthenticatedHeaders} from '@inrupt/solid-client-authn-browser';

import {Session} from "@inrupt/solid-client-authn-browser";

var id;
var secret;
var tokenUrl;

var isChrome;
const session = new Session();
session.clientAuthentication.cleanUrlAfterRedirect = () => {};
let tab;
const pendingRequests = {};

/**
 * Main function that is called upon extension (re)start
 */
function main() {
    isChrome = (navigator.userAgent.toLowerCase().includes("chrome"));

    getCredentialsFromBrowserStorage();

    /**
     * Runtime message listener, capable of handling and properly awaiting asynchronous functions
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessage(request).then(sendResponse);
        return true;
    });

    /**
     * Blocking web request listener that blocks a web request until the alteration of its request headers is completed
     */
    chrome.webRequest.onBeforeSendHeaders.addListener(
        rewriteRequestHeadersUsingOIDC,
        {
            // urls: ["https://pod.playground.solidlab.be/*", "https://*.solidcommunity.net/*", "*.inrupt.com/*", "<all_urls>"]
            urls: ["<all_urls>"]
        },
        ["blocking", "requestHeaders"]
    )

    chrome.webRequest.onBeforeSendHeaders.addListener(
      checkForPendingRequests,
      {
          // urls: ["https://pod.playground.solidlab.be/*", "https://*.solidcommunity.net/*", "*.inrupt.com/*", "<all_urls>"]
          urls: ["<all_urls>"]
      },
      ["blocking", "requestHeaders"]
    )

    chrome.webRequest.onBeforeRequest.addListener(
      checkForOIDCRedirect,
      {
          urls: ["https://whateveryouwant-solid.com/*"]
      },
      ["blocking", "requestBody"]
    )
}

/**
 * Rewrite request headers with correct credentials so that successful authentication may be achieved
 * @param {Object} details - Request details passed on from blocking web request listener
 * @returns {Object} - Object containing altered request headers, to be handled by the web request listener callback
 */
async function rewriteRequestHeadersUsingClientCredentials(details) {

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
    });

    details.requestHeaders.push({
        name: "dpop",
        value: dpopHeader
    });

    return {requestHeaders: details.requestHeaders}
}

async function rewriteRequestHeadersUsingOIDC(details) {
    if (details.method === "POST" || details.method === 'HEAD') {
        console.log(`rewriteRequestHeadersUsingOIDC: ignore ${details.url} because ${details.method}`);
        return
    }

    if (findHeader(details.requestHeaders, 'x-solid-extension') === 'sniff-headers') {
        console.log(`rewriteRequestHeadersUsingOIDC: ignore ${details.url} because ${findHeader(details.requestHeaders, 'x-solid-extension')}`);
        return
    }

    const statusCode = await sendHead(details.url);

    if (statusCode !== 401) {
        console.log(`rewriteRequestHeadersUsingOIDC: ignore ${details.url} because status ${statusCode} !== 401`);
        return
    }

    console.log(details.method);
    console.log(details.url);
    console.log(session.info);
    pendingRequests[details.url] = {
        status: 'pending'
    };
    console.log(pendingRequests[details.url]);
    try {
        await session.fetch(details.url, {
            headers: {
                'x-solid-extension': 'sniff-headers'
            }
        });
    } catch (e) {
        // This error is expected, because the fetch is only done to get the headers.
    }

    console.log(pendingRequests[details.url]);

    details.requestHeaders.push({
        name: "authorization",
        value: findHeader(pendingRequests[details.url].headers, 'authorization')
    })

    details.requestHeaders.push({
        name: "dpop",
        value: findHeader(pendingRequests[details.url].headers, 'dpop')
    })

    console.log(details.requestHeaders);
    delete pendingRequests[details.url];

    return {requestHeaders: details.requestHeaders}
}

async function checkForPendingRequests(details) {
    if (findHeader(details.requestHeaders, 'x-solid-extension') === 'sniff-headers') {
        pendingRequests[details.url].headers = details.requestHeaders;
        pendingRequests[details.url].status = 'headers available';
        console.log(details.requestHeaders);
        return {cancel: true};
    }
}

async function checkForOIDCRedirect(details) {
    console.log('web request made', details.url);
    session.handleIncomingRedirect(details.url).then(info => console.log('a', info));
    console.log(session.info)
    chrome.tabs.remove(tab.id);
    return { cancel: true }
}

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
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
    } else if (message.msg === "store-session-id") {
        console.log(message.id);
        storeInBrowserStorage({
            oidcSessionID: message.id
        });
    } else if (message.msg === "login-with-oidc") {
        session.login({
            redirectUrl: 'https://whateveryouwant-solid.com/',
            handleRedirect(url) {
                tab = chrome.tabs.create({ url }, t => { tab = t });
            },
            oidcIssuer: message.oidcIssuer
        });
    }
}

/**
 * Alter the browser action's icon in the toolbar depending on the success of an attempted log in
 * @param {Boolean} success - Potential success of log in that the icon should indicate
 */
function changeIcon(success) {
    const iconPath = success ? "solid-48-checkmark.png" : "solid-48.png";
    chrome.browserAction.setIcon({
        path: {
            "48": iconPath
        }
    });
}

/**
 * Load any potential client credentials still stored in the browser storage
 */
function getCredentialsFromBrowserStorage() {
    loadFromBrowserStorage("solidCredentials", function (result) {
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

/**
 * Store the current client credentials and token url into the browser storage
 * @param {String} id - Client ID
 * @param {String} secret - Client secret
 * @param {String} tokenUrl - Token url from which access tokens can be requested
 */
function storeCredentialsInBrowserStorage(id, secret, tokenUrl) {
    storeInBrowserStorage({
        solidCredentials: {
            id: id,
            secret: secret,
            tokenUrl: tokenUrl
        }
    })
}

/**
 * Remove any potential client credentials from browser storage
 */
function removeClientCredentialsFromBrowserStorage() {
    removeFromBrowserStorage("solidCredentials");
}

/**
 * Load item from the browser storage before calling a callback function with the loaded item as a parameter
 * @param {Object} item - Object containing the item which should be stored in the browser storage
 * @param {Function} callback - Callback function which is called after the item is added
 */
function loadFromBrowserStorage(item, callback) {
    chrome.storage.local.get(item, callback);
}

/**
 * Store item in the browser storage before calling a callback function
 * @param {String} item - Name of the item which should be loaded from the browser storage
 * @param {Function} callback - Callback function which is called after the item is loaded
 */
function storeInBrowserStorage(item, callback) {
    chrome.storage.local.set(item, callback);
}

/**
 * Remove item from the browser storage before calling a callback function
 * @param {String} item - Name of the item which should be removed from the browser storage
 * @param {Function} callback - Callback function which is called after the item is removed
 */
function removeFromBrowserStorage(item, callback) {
    chrome.storage.local.remove(item, callback);
}

function findHeader(requestHeaders, headerName) {
    if (!requestHeaders) {
        return null;
    }

    let i = 0;

    while(i < requestHeaders.length && requestHeaders[i].name !== headerName) {
        i ++;
    }

    if (i < requestHeaders.length) {
        return requestHeaders[i].value;
    }

    return null;
}

main();
