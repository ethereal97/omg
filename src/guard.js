const admin = require("firebase-admin");

function verifyToken(token) {
  return admin
    .auth()
    .verifyIdToken(token)
    .then((user) => user)
    .catch((err) => err);
}

async function auth(req, res, next) {
  // return next();
  const { roles } = this;
  try {
    if (!req.accessToken) throw { code: 401 };
    const auth = await verifyToken(req.accessToken);
    if (!auth.role || !roles.includes(auth.role)) {
      throw { code: 401, message: "Access permission denied" };
    }
    req.auth = auth;
    next();
  } catch (e) {
    console.error(e);
    res
      .status(e.code || 400)
      .json(e)
      .end();
  }
}

class Guard {
  static firebase(...roles) {
    return auth.bind({ roles });
  }
}

module.exports = Guard;
