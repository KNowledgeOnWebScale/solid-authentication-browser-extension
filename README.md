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



