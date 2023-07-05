# Solid Identity Extension

This Chrome extension acts as a remote control to **manage your Solid identities** and make it easy for the user to switch between their WebIDs.
The way this works is by giving the user the option to add _profiles_ to the extension which it will store to persist over the course of its use.
A profile describes either a WebID or an IDP. Subsequently the profile gets a display name and a color to generate an avatar used to distinguish between other profiles.
Profiles will be listed when clicking on the extension, and an active profile is shown in the top.

The extension provides an API to a Solid app either through the use of `chrome.runtime.connect` with the extension ID, or by using a plugin provided by us as an NPM package to make interfacing with the extension.
A draft of how this package would work can be found in `./showcase-app/plugin/`. The idea is for the **Solid app (not part of the extension) to manage the authentication**, and the extension **only provides a way of keeping track of profiles**.
Previous versions of this extension intercepted or modified network requests, and due to security concerns, this was not desirable.

## Quickstart

The extension was developed using `node:lts/hydrogen`. You can use `nvm` to synchronise this for local development.

```
npm i
npm start
```

This will start up the build-process with hot-reload.

To add the extension to the browser, navigate to `chrome://extensions/` and click `Load unpacked`. Navigate and add the `dist/` folder of this project.

Hot-reloading replenishes the files every time you save something in `src/`. In some cases, mainly when errors occur, you must reload the module in the `chrome://extensions/`. It should not be removed. You may pin the extension for convenience.

Use the `showcase-app` if you want to try out an example Solid app to test this extension end-to-end.

```
cd `./showcase-app`
yarn install
yarn start
```

Navigate to `http://localhost:5173/`. When the extension is present and has identities, the option will be shown to continue as the active set profile.

## Obtaining WebIDs for testing

You can create temporary WebIDs using `https://pod.playground.solidlab.be/idp/register/`. When creating a new profile you may add `https://pod.playground.solidlab.be` as the IDP, or the WebID you've obtained after registration.
These are reset daily, so make sure you've recreated it in order for authorization to work.

## License

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and
released under the [MIT license](http://opensource.org/licenses/MIT).
