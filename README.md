# Solid Authentication Extension

A firefox extension that replaces unauthenticated requests with authenticated Solid requests on Community Solid Servers.

## Client Credentials

Requests are authenticated using the [Client Credentials API](https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/)

The extension uses temporary access tokens that are created using either the client's email and password used on the server or a previously created id and secret linked to the user's WebID on the server.

## Development

To test the extension, bundle it first using webpack by running
```shell script
$ npm run build
```

This should place all the necessary bundled files in the newly created `dist/` directory in this projects working directory.

After that, install the [Firefox Browser Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).

Navigate to `about:debugging#/runtime/this-firefox` and select `Load Temporary Add-on` at the top of the page.

When a file explorer appears, navigate tot the aforementioned `dist` directory and select the `manifest.json` file withing this directory.
Do NOT select the manifest in the working directory itself, this will cause the extension to not work.

The extension should now be running, both it's browser popup and the background process. 

If you can't find the extension icon which opens the popup window, it's most likely unpinned and hidden away in the extension menu which can be opened by clicking the jigsaw icon on the top right of the browser window.


# Session

The extension will remember your credentials (ID & Secret combination) in your browser storage.

This will allow the extension to restore and reuse your previously generated id and secret after you press 
`reload`  in the aforementioned debugging menu until you log out manually.

Because the extension is not [signed](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox) yet, it's [add-on id](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/)
is not static yet. Because of this, if you remove and reload the extension or restart your browser and reload the extension, the extension won't find it's previously saved credentials in the browser storage and you will have to log in again.

# GET requests only

At this time, the extension will only add authentication to GET requests.
POST requests will not be blocked, but won't have any authentication either.

This is because, the (blocking) web request listener that catches any outgoing request from the browser user,
will catch any outgoing requests from the extension background script as well,
specifically POST request [requesting the token url](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/solid.js#L51-L60)
and [requesting access tokens from said url](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/solid.js#L30-L44).

To prevent an infinite loop of blocking web request listeners catching each other, any POST request that is caught, 
[will be passed](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/blob/8211dab9b7a42fa98eeef37158084788e62d251a/src/js/background.js#L48-L50) 
before any token url or access token is requested, and consequently any authentication is added.  
