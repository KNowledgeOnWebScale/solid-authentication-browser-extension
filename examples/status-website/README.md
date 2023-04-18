# Solid Authentication extension status website

This website shows the status of the Solid Authentication browser extension.
It shows if the extension is authenticated and what the WebID is of the logged-in agent.

## Requirements

You have this [commit](https://github.com/KNowledgeOnWebScale/solid-authentication-browser-extension/commit/56e1f4badd20eeb9af9f4a53feb2571339f69dfc) 
of the browser extension installed.

## Host website locally

1. Install dependencies via `npm i`.
2. Run HTTP server via `npm start`.
3. Browse to `http://localhost:8080`.

## How it works

The extension adds the property `solid` to `window` which the script of a Web page can access.
This property has the method `getStatus(callback)` that gets the status from the extension
and passes it **stringified** to the provided callback.
The status is an object that looks like when you are logged in:

```json
{
  "authenticated": true,
  "webId": "https://pod.playground.solidlab.be/ash/profile/card#me"
}
```

When you are not logged in the object is:

```json
{
  "authenticated": false
}
```

In the page script you do something like:

```javascript
window.solid.getStatus(status => {
  status = JSON.parse(status);
  console.log(status);
});
```
