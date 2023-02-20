import {getAccessToken} from "./solid.js";
import {createDpopHeader} from '@inrupt/solid-client-authn-core';


const id = "extension-token_9fa32a63-1aaf-4aa8-9250-f8efab7e5235";
const secret = "1cfccf127a545c599564d2e9196e470212ba2d1b701b6881620e66aed693850a06224b7b67942ac0714979f3b04caff8263eedc5e371529a05e6264af21f7219"

// TODO: pull authorization endpoint from ".well-known/openid-configuration" path
const tokenUrl = "https://pod.playground.solidlab.be/.oidc/token";


const isChrome = (navigator.userAgent.toLowerCase().includes("chrome"));
console.log("Solid auth extension background script running")
console.log("is chrome? : " + isChrome)

chrome.webNavigation.onCompleted.addListener(async function (details) {

})

async function rewriteRequestHeaders(details) {

    // TODO: find a more elegant way to catch the access token creation request called from getAccessToken()
    if (details.method === "POST") {
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
