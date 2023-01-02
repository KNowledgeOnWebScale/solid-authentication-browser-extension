# Solid Authentication Extension

A firefox extension that replaces unauthenticated requests with authenticated Solid requests on Community Solid Servers.

As of now, the extension only catches unauthenticated requests on [SolidLab Playground](https://pod.playground.solidlab.be/) pods.

## Client Credentials

Requests are authenticated using the [Client Credentials API](https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/)

The extension uses temporary access tokens that are created using either the client's email and password used on the server or a previously created id and secret linked to the user's WebID on the server.

## Development

Test the plugin in a development instance of Firefox by running
```shell script
$ npm start
```

This also creates a zip file containing the extension in the directory `web-ext-artifacts`

This artifact can also be created without starting the Firefox instance by running
```shell script
$ npm run build
```