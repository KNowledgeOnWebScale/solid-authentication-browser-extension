import fetch from 'node-fetch';
import {createDpopHeader, generateDpopKeyPair} from '@inrupt/solid-client-authn-core';


/**
 * Generate a token and secret linked to the users account and WebID
 * @param {String} email - User email for pod on the server
 * @param {String} password - User password for pod on the server
 * @param {String} credentialsUrl - Url from which user credentials can be requested
 * @returns {(String, String)} - Tuple containing user id and secret linked to the users WebID
 */
export async function getToken(email, password, credentialsUrl) {
    const invalidIDPMessage = 'IDP is invalid';
    let response;

    try {
        response = await fetch(credentialsUrl, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({email: email, password: password, name: 'extension-token'}),
        });
    } catch (e) {
        throw new Error(invalidIDPMessage);
    }

    if (response.status === 500) {
        const error = await response.json();
        throw new Error(error.message);
    } else if (!response.ok) {
        throw new Error(invalidIDPMessage);
    }

    const {id, secret} = await response.json();
    return {id, secret}
}

/**
 * Generate a temporary access token to make authenticated requests
 * @param {String} id - User id linked to the users WebID
 * @param {String} secret - User secret linked to the users WebID
 * @param {String} tokenUrl - Url from which an access token can be requested from the server
 * @returns {String, KeyPair} - Temporary Access Token and it's corresponding keypair
 */
export async function getAccessToken(id, secret, tokenUrl) {
    const dpopKey = await generateDpopKeyPair();
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
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
    return {accessToken, dpopKey};
}

/**
 * Request the url from which access tokens can be requested on a server
 * @param {String} url - Url/domain on which the server is hosted
 * @returns {String} - Url from which access tokens can be requested
 */
export async function getTokenUrl(url) {
    let requestUrl = url + ".well-known/openid-configuration"
    const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            'content-type': 'application/json'
        }
    });
    return (await (await response.json())).token_endpoint;
}



/**
 * Send HEAD request to a url and return the status code of the response
 * @param {String} url - Url to which a HEAD request should be sent
 * @returns {number} - Status code of response
 */
export async function sendHead(url) {
    const response = await fetch(url, {
            method: "HEAD"
        }
    )
    return response.status;
}
