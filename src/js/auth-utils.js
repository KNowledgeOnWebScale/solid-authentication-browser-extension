import {InMemoryStorage, Session} from "@inrupt/solid-client-authn-browser";
import ClientRegistrar from "@inrupt/solid-client-authn-browser/dist/login/oidc/ClientRegistrar";
import {SessionInfoManager} from "@inrupt/solid-client-authn-node/dist/sessionInfo/SessionInfoManager";
import TokenRefresher from "@inrupt/solid-client-authn-browser/dist/login/oidc/refresh/TokenRefresher";
import ClientAuthentication from "@inrupt/solid-client-authn-browser/dist/ClientAuthentication";
import GeneralLogoutHandler from "@inrupt/solid-client-authn-browser/dist/logout/GeneralLogoutHandler";
import {buildLoginHandler, buildRedirectHandler} from "@inrupt/solid-client-authn-node/dist/dependencies";
import StorageUtilityNode from "@inrupt/solid-client-authn-node/dist/storage/StorageUtility";
import IssuerConfigFetcher from "@inrupt/solid-client-authn-node/dist/login/oidc/IssuerConfigFetcher";

// I'm not using this at the moment. The idea was to try to copy and edit some of the code of the auth lib,
// but I got dragged into a rabbit hole that I didn't want to be in.

export async function getSessionFromStorage(
  sessionId,
  storage,
  onNewRefreshToken
) {
  const clientAuth = getClientAuthenticationWithDependencies({
      secureStorage: storage,
      insecureStorage: storage,
    });

  const sessionInfo = await clientAuth.getSessionInfo(sessionId);
  if (sessionInfo === undefined) {
    return undefined;
  }

  const session = new Session({
    sessionInfo,
    clientAuthentication: clientAuth,
    onNewRefreshToken,
  });

  if (sessionInfo.refreshToken) {
    await session.login({
      oidcIssuer: sessionInfo.issuer,
    });
  }

  return session;
}

/**
 *
 * @param dependencies
 * @deprecated This function will be removed from the external API in an upcoming release.
 */
function getClientAuthenticationWithDependencies(dependencies = {}) {
  const inMemoryStorage = new InMemoryStorage();
  const secureStorage = dependencies.secureStorage || inMemoryStorage;
  const insecureStorage = dependencies.insecureStorage || inMemoryStorage;

  const storageUtility = new StorageUtilityNode(secureStorage, insecureStorage);

  const issuerConfigFetcher = new IssuerConfigFetcher(storageUtility);
  const clientRegistrar = new ClientRegistrar(storageUtility);

  const sessionInfoManager = new SessionInfoManager(storageUtility);

  const tokenRefresher = new TokenRefresher(
    storageUtility,
    issuerConfigFetcher,
    clientRegistrar
  );

  const loginHandler = buildLoginHandler(
    storageUtility,
    tokenRefresher,
    issuerConfigFetcher,
    clientRegistrar
  );

  const redirectHandler = buildRedirectHandler(
    storageUtility,
    sessionInfoManager,
    issuerConfigFetcher,
    clientRegistrar,
    tokenRefresher
  );

  return new ClientAuthentication(
    loginHandler,
    redirectHandler,
    new GeneralLogoutHandler(sessionInfoManager),
    sessionInfoManager
  );
}
