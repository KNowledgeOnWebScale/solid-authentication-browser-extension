//import fetch from 'node-fetch';
const fetch = require('node-fetch').default
import {buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair} from '@inrupt/solid-client-authn-core';


/**
 * Generate a token and secret linked to the users account and WebID
 * @param {String} email - User email for pod on the server
 * @param {String} password - User password for pod on the server
 * @returns {(String, String)} - Tuple containing user id and secret linked to the users WebID
 */
export async function getToken(email, password) {
    const response = await fetch('https://pod.playground.solidlab.be/idp/credentials/', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({email: email, password: password, name: 'extension-token'}),
    });

    const {id, secret} = await response.json();
    return {id, secret}
}

/**
 * Generate a temporary access token to make authenticated requests
 * @param {String} id - User id linked to the users WebID
 * @param {String} secret - User secret linked to the users WebID
 * @returns {String} - Temporary Access Token
 */
export async function getAccessToken(id, secret) {
    const dpopKey = await generateDpopKeyPair();
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    const tokenUrl = 'https://pod.playground.solidlab.be/.oidc/token';
    const receive = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
    });
    const {access_token: accessToken} = await receive.json();
    return {access_token: accessToken, dpopkey: dpopKey};
}

/**
 * Make an authenticated request on a url using a temporary access token
 * @param {String} url - Url of a resource that needs authentication
 * @param {String} accessToken - User access token
 * @param {KeyPair} dpopKey - dpopKey
 * @returns {Promise<Response>} - Authenticated response on url
 */
export async function makeAuthenticadedRequest(url, accessToken, dpopKey) {
    const authFetch = await buildAuthenticatedFetch(fetch, accessToken, {dpopKey});
    return await authFetch(url);
}
