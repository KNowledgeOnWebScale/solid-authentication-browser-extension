import {getAccessToken, makeAuthenticadedRequest} from "./solid.js";

const id = "extension-token_0c617d74-fa1f-43a5-a703-43cbf4ebe712";
const secret = "0cddf4822aa158bb6679be5c02d14c6237263ee964b396f456c485ea33ecb48335c9e19b68c0bc260cb3f8778f4749729d0870cbfc735b9c6cd27ddc81bcb3aa"

console.log("Solid auth extension service worker running")

chrome.webNavigation.onCompleted.addListener(async function (details) {

    console.log("current request url: ", details.url)

    const {access_token, dpopkey} = await getAccessToken(id, secret);

    const response = await makeAuthenticadedRequest(details.url, access_token, dpopkey)

    const content = await response.text()

    console.log("token: ", access_token)
    console.log("dpopkey: ", await dpopkey.publicKey)
    console.log(content)
})

chrome.webRequest.onBeforeSendHeaders.addListener(
    // Added headers should look like this
    //
    // {
    // authorization: "DPoP <access token>",
    // dpop: "<dpop key that is outputted from await createDpopHeader(...) in getAccessToken>"
    // }
)