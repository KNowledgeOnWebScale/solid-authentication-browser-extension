import {getAccessToken, getToken, getTokenUrl, sendHead} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';


let id;
let secret;
let tokenUrl;
let domainFilter;
let enableRegex;

let isChrome;


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
        rewriteRequestHeaders,
        {
            urls: ["<all_urls>"]
        },
        ["blocking", "requestHeaders"]
    )
}

/**
 * Rewrite request headers with correct credentials so that successful authentication may be achieved
 * @param {Object} details - Request details passed on from blocking web request listener
 * @returns {Object} - Object containing altered request headers, to be handled by the web request listener callback
 */
async function rewriteRequestHeaders(details) {

    // TODO: find a more elegant way to catch the access token creation request or HEAD status code test request
    if (details.method === "POST" || details.method === "HEAD") {
        return
    }

    if (await sendHead(details.url) !== 401) {
        return
    }

    if (id === undefined || secret === undefined || tokenUrl === undefined || domainFilter === undefined) {
        return;
    }

    if (domainFilter !== '') {
        if (enableRegex) {
            const regexp = new RegExp(domainFilter);
            const fullMatch = details.url.match(regexp).includes(details.url);
            if (!fullMatch) {
                return;
            }
        } else if (!details.url.includes(domainFilter)) {
            return;
        }
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

    return {requestHeaders: details.requestHeaders};
}

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
async function handleMessage(message) {
    switch (message.msg) {

        case "generate-id":
            const credentialsUrl = message.idp + "idp/credentials/";
            tokenUrl = await getTokenUrl(message.idp);

            const response = await getToken(message.email, message.password, credentialsUrl);
            id = response.id;
            secret = response.secret;

            domainFilter = message.filter;
            enableRegex = message.regex;

            let success = true;
            let error;
            try {
                const credentials = await getToken(message.email, message.password, credentialsUrl);
                id = credentials.id;
                secret = credentials.secret;
                storeCredentialsInBrowserStorage(id, secret, tokenUrl, domainFilter, enableRegex);
            } catch (e) {
                success = false;
                error = e.message;
            }

            changeIcon(success);

            return {
                success,
                error
            };

        case "logout":
            id = undefined;
            secret = undefined;
            tokenUrl = undefined;
            domainFilter = undefined;
            enableRegex = undefined;

            changeIcon(false);
            removeClientCredentialsFromBrowserStorage();
            return;

        case "check-authenticated":
            const authenticated = (id !== undefined && secret !== undefined && tokenUrl !== undefined);
            return {
                authenticated
            };

        case "get-filter":
            return {
                domainFilter,
                enableRegex
            }

        case "update-filter":
            domainFilter = message.filter;
            enableRegex = message.regex;
            storeCredentialsInBrowserStorage(id, secret, tokenUrl, domainFilter, enableRegex);
            return;
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
            domainFilter = result.solidCredentials.domainFilter;
            enableRegex = result.solidCredentials.enableRegex;
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
 * @param {String} domainFilter - Filter for domain to which requests require authentication
 * @param {Boolean} enableRegex - Indicates whether domainFilter is regex syntax
 */
function storeCredentialsInBrowserStorage(id, secret, tokenUrl, domainFilter, enableRegex) {
    storeInBrowserStorage({
        solidCredentials: {
            id: id,
            secret: secret,
            tokenUrl: tokenUrl,
            domainFilter: domainFilter,
            enableRegex: enableRegex
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

main();
