# Solid Authentication Extension

This FireFox extension replaces unauthenticated requests with authenticated Solid requests.
This extension only works with WebIDs that use 
the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer) (>= v4.0.0)
as identity provider.

## Client Credentials

Requests are authenticated using the 
[Client Credentials API](https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/).
You need at least v4.0.0 of the Community Solid Server for this to work.

The extension uses temporary access tokens that are created using either 
the client's email and password used on the server or 
a previously created id and secret linked to the user's WebID on the server.

You can create a Solid pod for testing via the [SolidLab Playground](https://pod.playground.solidlab.be/).

## Development environment

- [Node.js](https://nodejs.org/en) v18.12.1
- npm v8.19.2

You find instructions on how to install Node.js and npm 
[here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm).

Tested on macOS 13.1.

## Development

You can develop and test the by doing the following steps:

1. Install dependencies via 
   ```shell
   npm i
   ```
2. Build the extension using webpack via
   ```shell
   npm run build
   ```
   This places all the necessary bundled files in the newly created `dist` directory .
3. Install the [Firefox Browser Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).
4. Navigate to `about:debugging#/runtime/this-firefox`.
5. Select `Load Temporary Add-on` at the top of the page.
6. When a file explorer appears, navigate tot the aforementioned `dist` directory and select the `manifest.json` file withing this directory.
Do NOT select the manifest in the working directory itself, this will cause the extension to not work.
7. The extension should now be running, both it's browser popup and the background process. 

If you can't find the extension icon which opens the popup window, 
it's most likely unpinned and hidden away in the extension menu which can be opened by 
clicking the jigsaw icon on the top right of the browser window.

## Package

You can package the extension for distribution and signing via the following steps:

1. Build the extension via
   ```shell
   npm run build
   ```
2. Package the extension via
   ```shell
   npm run package
   ```
3. The result is `solid-authentication.zip`.

## Signed version

If you want to use the extension with the standard edition of FireFox,
you need to use the signed version of the extension.
You find this version in assets of 
the [releases](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/releases).
The file ends with `.xpi`.

You find more information about how to add an extension to FireFox from a file
[here](https://support.mozilla.org/en-US/kb/find-and-install-add-ons-add-features-to-firefox#w_how-do-i-find-and-install-add-ons).

## Session

The extension will remember your credentials (ID & Secret combination) in your browser storage.

This will allow the extension to restore and reuse your previously generated id and secret after you press 
`reload`  in the aforementioned debugging menu until you log out manually.

Because the extension is not [signed](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox) during development, 
it's [add-on id](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/)
is not static. 
Because of this, 
if you remove and reload the extension or restart your browser and reload the extension, 
the extension won't find it's previously saved credentials in the browser storage and you will have to log in again.

## GET requests only

At this time, the extension will only add authentication to GET requests.
POST requests will not be blocked, but won't have any authentication either.

This is because, the (blocking) web request listener that catches any outgoing request from the browser user,
will catch any outgoing requests from the extension background script as well,
specifically POST request [requesting the token url](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/solid.js#L51-L60)
and [requesting access tokens from said url](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/solid.js#L30-L44).

To prevent an infinite loop of blocking web request listeners catching each other, any POST request that is caught, 
[will be passed](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/background.js#L48-L50) 
before any token url or access token is requested, and consequently any authentication is added.  

## Screencast

You find a screencast of the extension [here](https://cloud.ilabt.imec.be/index.php/s/QbabTcHkX2J8GHG).

## Tested servers with OIDC login

| IDP | Resource | Works? | Comments                                             |                                                      
|-----|----------|--------|------------------------------------------------------|
| CSS | CSS      | Yes    |                                                      |
| ESS | ESS      | Yes    |                                                      |
| NSS | NSS      | No     | Something weird with status codes received from NSS. |
| NSS | CSS      | Yes    |                                                      |
