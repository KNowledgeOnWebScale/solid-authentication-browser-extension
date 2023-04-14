export class Handler {
  ignoreRequest(details) {
    throw new Error("You must implement the method ignoreRequest.");
  }

  async getAuthHeaders(details) {
    throw new Error("You must implement the method getAuthHeaders.");
  }

  login(oidcIssuer) {
    throw new Error("You must implement the method login.");
  }

  async logout() {
    throw new Error("You must implement the method logout.");
  }

  isLoggedIn() {
    throw new Error("You must implement the method isLoggedIn.");
  }

  restore() {
    throw new Error("You must implement the method restore.");
  }

  cleanUpRequest(url) {
    // Implementing this method is not required.
  }

  getUserName() {
    return null;
  }
}
