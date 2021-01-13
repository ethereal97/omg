class User {
  constructor({
    uid,
    displayName,
    email,
    phoneNumber,
    customClaims,
    providerData,
    photoURL,
    metadata: { creationTime, lastSignInTime, lastRefreshTime },
  }) {
    this.uid = uid;
    this.displayName = displayName;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.role = customClaims && customClaims.role;
    this.providers = providerData.map((provider) => provider.providerId);
    this.photoURL = photoURL;
    this.createdAt = Date.parse(creationTime);
    this.lastSignIn = Date.parse(lastSignInTime);
    this.lastSeen = Date.parse(lastRefreshTime);
  }
}

module.exports = User;
