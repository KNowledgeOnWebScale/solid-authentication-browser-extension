import {OIDCHandler} from "./oidc-handler";
import {ClientCredentialsHandler} from "./client-credentials-handler";
import {findHeader} from "./utils";

const oidcHandler = new OIDCHandler({
    loggedInCallback: changeIcon,
    loggedOutCallback: changeIcon
});
const clientCredentialsHandler = new ClientCredentialsHandler({
    loggedInCallback: changeIcon,
    loggedOutCallback: changeIcon
});

let handler;

/**
 * Main function that is called upon extension (re)start
 */
async function main() {
    if (await getCurrentLoginMethod() === 'oidc') {
        handler = oidcHandler;
    } else {
        handler = clientCredentialsHandler;
    }

    handler.restore();

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
async function rewriteRequestHeadersForAuth(details) {
    const {url, requestId, method, requestHeaders} = details;

    if (method !== 'GET' && method !== 'PUT') {
        console.debug(`rewriteRequestHeadersUsingOIDC: ignore ${url} because ${method}`);
        return
    }

    if (handler.ignoreRequest(details)) {
        return
    }

    console.debug(`Getting headers for request ID: ${requestId}`);
    const {authorization, dpop} = await handler.getAuthHeaders(details);

    if (authorization && dpop) {
        console.log(`Adding authorization and dpop headers for ${method} ${url} (${requestId}).`);

        if (findHeader(requestHeaders, 'authorization')) {
            console.error(`Already authorization header present for ${url} (${requestId}).`);
            console.error(details);
            return;
        }

        if (findHeader(requestHeaders, 'dpop')) {
            console.error(`Already dpop header present for ${url} (${requestId}).`);
            console.error(details);
            return;
        }

        details.requestHeaders.push({
            name: "authorization",
            value: authorization
        });

        details.requestHeaders.push({
            name: "dpop",
            value: dpop
        });

        console.log(requestHeaders);
    }

    handler.cleanUpRequest(requestId);

    return {requestHeaders}
}

/**
 * Handle various runtime messages sent from the browser action popup
 * @param {Object} message - Message object that contains various parameters, specific to the message's purpose
 */
async function handleMessage(message) {
    if (message.msg === "login-with-client-credentials") {
        setCurrentLoginMethod('client-credentials');
        handler = clientCredentialsHandler;

        const success = await handler.login({
            oidcIssuer: message.idp,
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
            authenticated: handler.isLoggedIn(),
            name: handler.getUserName()
        };
    } else if (message.msg === "login-with-oidc") {
        setCurrentLoginMethod('oidc');
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
 *
 * @returns {Promise<unknown>}: "oidc" or "client-credentials".
 */
async function getCurrentLoginMethod() {
    return new Promise(resolve => {
        let method = 'oidc' // Default method

        chrome.storage.local.get('loginMethod', result => {
            if (result.loginMethod) {
                method = result.loginMethod;
            }

            resolve(method);
        });
    });
}

/**
 * Save login method to browser storage.
 * @param loginMethod - The login method which is either "oidc" or "client-credentials".
 */
function setCurrentLoginMethod(loginMethod) {
    chrome.storage.local.set({loginMethod});
}

main();
