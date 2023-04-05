import {getAccessToken, getToken, getTokenUrl, sendHead} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';

import {OIDCHandler} from "./oidc-handler";
import {ClientCredentialsHandler} from "./client-credentials-handler";

var id;
var secret;
var tokenUrl;

var isChrome;
const oidcHandler = new OIDCHandler({
    loggedInCallback: changeIcon,
    loggedOutCallback: changeIcon
});
const clientCredentialsHandler = new ClientCredentialsHandler({
    loggedInCallback: changeIcon,
    loggedOutCallback: changeIcon
});

let handler = oidcHandler;

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
        rewriteRequestHeadersForAuth,
        {
            // urls: ["https://pod.playground.solidlab.be/*", "https://*.solidcommunity.net/*", "*.inrupt.com/*", "<all_urls>"]
            urls: ["<all_urls>"]
        },
        ["blocking", "requestHeaders"]
    )

    chrome.webRequest.onBeforeSendHeaders.addListener(
      oidcHandler.checkForPendingRequests.bind(oidcHandler),
      {
          // urls: ["https://pod.playground.solidlab.be/*", "https://*.solidcommunity.net/*", "*.inrupt.com/*", "<all_urls>"]
          urls: ["<all_urls>"]
      },
      ["blocking", "requestHeaders"]
    )

    chrome.webRequest.onBeforeRequest.addListener(
      oidcHandler.checkForOIDCRedirect.bind(oidcHandler),
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

async function rewriteRequestHeadersForAuth(details) {
    if (details.method !== 'GET') {
        console.log(`rewriteRequestHeadersUsingOIDC: ignore ${details.url} because ${details.method}`);
        return
    }

    if (handler.ignoreRequest(details)) {
        return
    }

    const statusCode = await sendHead(details.url);

    if (statusCode !== 401) {
        console.log(`rewriteRequestHeadersUsingOIDC: ignore ${details.url} because status ${statusCode} !== 401`);
        return
    }

    console.log(details.method);
    console.log(details.url);
    const {authorization, dpop} = await handler.getAuthHeaders(details);

    details.requestHeaders.push({
        name: "authorization",
        value: authorization
    })

    details.requestHeaders.push({
        name: "dpop",
        value: dpop
    })

    console.log(details.requestHeaders);
    handler.cleanUpRequest(details.url);

    return {requestHeaders: details.requestHeaders}
}

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
async function handleMessage(message) {
    if (message.msg === "login-with-client-credentials") {
        handler = clientCredentialsHandler;

        const success = await handler.login({
            iodcIssuer: message.idp,
            email: message.email,
            password: message.password
        });

        return {
            success
        };

    } else if (message.msg === "logout") {
        handler.logout();
    } else if (message.msg === "check-authenticated") {
        return {
            authenticated: handler.isLoggedIn()
        };
    } else if (message.msg === "login-with-oidc") {
        handler.login({oidcIssuer: message.oidcIssuer});
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
 * Load item from the browser storage before calling a callback function with the loaded item as a parameter
 * @param {Object} item - Object containing the item which should be stored in the browser storage
 * @param {Function} callback - Callback function which is called after the item is added
 */
function loadFromBrowserStorage(item, callback) {
    chrome.storage.local.get(item, callback);
}

main();
